/**
 * Slab Matching and Allocation Utility
 * 
 * This module handles intelligent matching of requested slabs to available stock,
 * including cutting larger slabs to fulfill smaller requests, combining multiple
 * stock entries, and handling all edge cases.
 */

export interface SlabRequest {
  length: number;
  width: number;
  numberOfSlabs: number;
}

export interface AvailableSlab {
  stockEntryId: number;
  marbleId: number;
  shade: string;
  length: number;
  width: number;
  numberOfSlabs: number;
  totalQuantity: number; // sq ft
}

export interface SlabAllocation {
  stockEntryId: number;
  marbleId: number;
  shade: string;
  slabsUsed: number; // Number of full slabs used
  quantityUsed: number; // Total sq ft used
  remainingSlabs?: number; // Remaining slabs after cutting (if partial)
  remainingLength?: number; // Remaining dimensions after cutting
  remainingWidth?: number;
  waste?: number; // Waste/scrap generated
  allocationType: 'exact' | 'cut' | 'partial';
}

export interface AllocationResult {
  allocations: SlabAllocation[];
  totalQuantityAllocated: number;
  totalWaste: number;
  canFulfill: boolean;
  message?: string;
}

/**
 * Check if a slab can be cut to fulfill a request
 * A slab can be cut if its area is >= requested area
 */
export function canCutSlab(
  availableLength: number,
  availableWidth: number,
  requestedLength: number,
  requestedWidth: number
): boolean {
  const availableArea = availableLength * availableWidth;
  const requestedArea = requestedLength * requestedWidth;
  return availableArea >= requestedArea;
}

/**
 * Calculate how many requested slabs can be cut from one available slab
 * Considers both orientations (lengthwise and widthwise)
 */
export function calculateCutsPerSlab(
  availableLength: number,
  availableWidth: number,
  requestedLength: number,
  requestedWidth: number
): { cutsPerSlab: number; waste: number; orientation: 'lengthwise' | 'widthwise' } {
  const availableArea = availableLength * availableWidth;
  const requestedArea = requestedLength * requestedWidth;
  
  // Calculate how many can fit lengthwise (requested length along available length)
  const cutsLengthwise = Math.floor(availableLength / requestedLength) * Math.floor(availableWidth / requestedWidth);
  
  // Calculate how many can fit widthwise (requested width along available length)
  const cutsWidthwise = Math.floor(availableLength / requestedWidth) * Math.floor(availableWidth / requestedLength);
  
  // Choose the orientation that gives more cuts
  const cutsPerSlab = Math.max(cutsLengthwise, cutsWidthwise, 0);
  const orientation = cutsLengthwise >= cutsWidthwise ? 'lengthwise' : 'widthwise';
  const totalRequestedArea = cutsPerSlab * requestedArea;
  const waste = availableArea - totalRequestedArea;
  
  return { cutsPerSlab, waste, orientation };
}

/**
 * Find the best way to allocate slabs from available stock
 * This uses a greedy algorithm that:
 * 1. First tries exact matches
 * 2. Then tries cutting larger slabs
 * 3. Minimizes waste
 */
export function allocateSlabs(
  request: SlabRequest,
  availableSlabs: AvailableSlab[]
): AllocationResult {
  const { length: reqLength, width: reqWidth, numberOfSlabs: reqSlabs } = request;
  const requestedArea = reqLength * reqWidth;
  const totalRequestedArea = requestedArea * reqSlabs;
  
  // Sort available slabs by:
  // 1. Exact matches first
  // 2. Then by waste (ascending) - prefer slabs that minimize waste
  // 3. Then by total quantity (descending) - prefer larger stock entries
  const sortedSlabs = [...availableSlabs].sort((a, b) => {
    const aExact = a.length === reqLength && a.width === reqWidth;
    const bExact = b.length === reqLength && b.width === reqWidth;
    
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    // Calculate waste for each (considering cuts per slab efficiency)
    const aCuts = calculateCutsPerSlab(a.length, a.width, reqLength, reqWidth);
    const bCuts = calculateCutsPerSlab(b.length, b.width, reqLength, reqWidth);
    
    // Prefer slabs with more cuts per slab (more efficient)
    // If same efficiency, prefer less waste
    const aEfficiency = aCuts.cutsPerSlab;
    const bEfficiency = bCuts.cutsPerSlab;
    
    if (aEfficiency !== bEfficiency) {
      return bEfficiency - aEfficiency; // More cuts per slab is better
    }
    
    const aWaste = aCuts.waste;
    const bWaste = bCuts.waste;
    
    if (Math.abs(aWaste - bWaste) > 0.01) {
      return aWaste - bWaste; // Less waste is better
    }
    
    return b.totalQuantity - a.totalQuantity; // Larger quantity is better
  });
  
  const allocations: SlabAllocation[] = [];
  let remainingSlabsNeeded = reqSlabs;
  let totalQuantityAllocated = 0;
  let totalWaste = 0;
  
  for (const available of sortedSlabs) {
    if (remainingSlabsNeeded <= 0) break;
    
    // Check if this is an exact match
    if (available.length === reqLength && available.width === reqWidth) {
      const slabsToUse = Math.min(remainingSlabsNeeded, available.numberOfSlabs);
      const quantityUsed = slabsToUse * requestedArea;
      
      allocations.push({
        stockEntryId: available.stockEntryId,
        marbleId: available.marbleId,
        shade: available.shade,
        slabsUsed: slabsToUse,
        quantityUsed,
        remainingSlabs: available.numberOfSlabs - slabsToUse,
        allocationType: 'exact',
      });
      
      remainingSlabsNeeded -= slabsToUse;
      totalQuantityAllocated += quantityUsed;
    } else if (canCutSlab(available.length, available.width, reqLength, reqWidth)) {
      // Can cut this slab
      const { cutsPerSlab, waste: wastePerSlab, orientation } = calculateCutsPerSlab(
        available.length,
        available.width,
        reqLength,
        reqWidth
      );
      
      if (cutsPerSlab > 0) {
        // Calculate how many full available slabs we need
        const slabsNeeded = Math.ceil(remainingSlabsNeeded / cutsPerSlab);
        const slabsToUse = Math.min(slabsNeeded, available.numberOfSlabs);
        const cutsObtained = slabsToUse * cutsPerSlab;
        const actualCutsUsed = Math.min(cutsObtained, remainingSlabsNeeded);
        
        const quantityUsed = actualCutsUsed * requestedArea;
        const totalWasteForThis = slabsToUse * wastePerSlab;
        
        // Calculate remaining dimensions after cutting
        // This is a simplified calculation - in practice, you'd track actual cut patterns
        let remainingLength = available.length;
        let remainingWidth = available.width;
        
        // If we used partial slabs, calculate what's left
        if (actualCutsUsed < cutsObtained) {
          // We have leftover cuts from the last slab
          const unusedCutsFromLastSlab = cutsObtained - actualCutsUsed;
          // For simplicity, we'll assume the remaining piece is the original slab size
          // In a real system, you'd calculate the actual remaining dimensions
          remainingLength = available.length;
          remainingWidth = available.width;
        }
        
        allocations.push({
          stockEntryId: available.stockEntryId,
          marbleId: available.marbleId,
          shade: available.shade,
          slabsUsed: slabsToUse,
          quantityUsed,
          remainingSlabs: available.numberOfSlabs - slabsToUse,
          remainingLength: slabsToUse < available.numberOfSlabs ? available.length : undefined,
          remainingWidth: slabsToUse < available.numberOfSlabs ? available.width : undefined,
          waste: totalWasteForThis,
          allocationType: actualCutsUsed === cutsObtained ? 'cut' : 'partial',
        });
        
        remainingSlabsNeeded -= actualCutsUsed;
        totalQuantityAllocated += quantityUsed;
        totalWaste += totalWasteForThis;
      }
    }
  }
  
  const canFulfill = remainingSlabsNeeded <= 0;
  
  return {
    allocations,
    totalQuantityAllocated,
    totalWaste,
    canFulfill,
    message: canFulfill
      ? undefined
      : `Insufficient stock. Need ${remainingSlabsNeeded} more slab(s) of ${reqLength}x${reqWidth} ft.`,
  };
}

/**
 * Calculate total available quantity from stock entries
 */
export function calculateTotalAvailable(availableSlabs: AvailableSlab[]): number {
  return availableSlabs.reduce((sum, slab) => sum + slab.totalQuantity, 0);
}

/**
 * Check if there's enough total quantity (area) available
 * This is a quick check before doing detailed allocation
 */
export function hasEnoughQuantity(
  request: SlabRequest,
  availableSlabs: AvailableSlab[]
): boolean {
  const requestedArea = request.length * request.width * request.numberOfSlabs;
  const totalAvailable = calculateTotalAvailable(availableSlabs);
  return totalAvailable >= requestedArea;
}
