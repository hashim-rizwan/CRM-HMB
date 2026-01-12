# Slab Allocation and Stock Management Logic

## Overview

This document explains how the system handles dynamic slab allocation when removing or reserving stock. The system intelligently matches requested slabs to available stock, handling exact matches, cutting larger slabs, and managing edge cases.

## Example Scenario

**Request:** 3 slabs of 2ft x 2ft from Travertine Shade A

**Available Inventory:**
- 7 slabs of 5ft x 6ft (210 sq ft total)
- 6 slabs of 4ft x 4ft (96 sq ft total)

## How It Works

### 1. Slab Matching Algorithm

The system uses a greedy algorithm that:

1. **Prioritizes Exact Matches**: If available slabs match the requested dimensions exactly, these are used first.
2. **Finds Best Cuts**: For non-exact matches, calculates how many requested pieces can be cut from each available slab.
3. **Minimizes Waste**: Prefers allocations that generate less waste material.
4. **Uses FIFO**: Processes stock entries in First-In-First-Out order (oldest first).

### 2. Cutting Calculations

For the example above:

**From 4ft x 4ft slabs:**
- Can cut: 2 rows × 2 columns = **4 pieces of 2ft x 2ft** per slab
- For 3 pieces needed: Use 1 slab (1 piece remains as remnant)

**From 5ft x 6ft slabs:**
- Can cut: 2 rows × 3 columns = **6 pieces of 2ft x 2ft** per slab
- For 3 pieces needed: Use 1 slab (3 pieces remain as remnant)

**System Choice:** The algorithm will choose the 4ft x 4ft slab because:
- It's more efficient (less waste per piece)
- It's an exact multiple (4 pieces from 1 slab)

### 3. Stock Entry Updates

When slabs are allocated:

**Exact Match:**
- Reduces `numberOfSlabs` in the StockEntry
- Updates `quantity` (sq ft)
- If all slabs used, deletes the StockEntry

**Cut/Partial:**
- Reduces `numberOfSlabs` for slabs fully used
- Updates `quantity` accordingly
- Creates new StockEntry records for significant remnants (>1 sq ft)

### 4. Edge Cases Handled

1. **Insufficient Stock**: Validates total available quantity before allocation
2. **Multiple Stock Entries**: Can combine multiple entries to fulfill a request
3. **Partial Slab Usage**: Tracks remaining pieces when only part of a slab is used
4. **Waste Management**: Calculates and reports waste generated from cutting
5. **Remnant Creation**: Creates new StockEntry records for usable remnants

## Data Flow

### Remove Stock Flow:
1. Validate request (marble type, shade, dimensions, quantity)
2. Find marble record and verify shade is active
3. Fetch all StockEntry records for the marble/shade
4. Convert to AvailableSlab format
5. Run allocation algorithm
6. Update/delete StockEntry records
7. Create StockTransaction record
8. Update marble status
9. Create notification if stock is low

### Reserve Stock Flow:
1. Same as Remove Stock steps 1-5
2. Create ReservedStock record
3. Update/delete StockEntry records
4. Create StockTransaction record
5. Update marble status
6. Create notification if stock is low

## Key Functions

### `allocateSlabs(request, availableSlabs)`
Main allocation function that:
- Sorts available slabs by efficiency
- Allocates slabs to fulfill request
- Returns allocation result with details

### `calculateCutsPerSlab(available, requested)`
Calculates:
- How many requested pieces can be cut from one available slab
- Waste generated
- Best orientation (lengthwise vs widthwise)

### `canCutSlab(available, requested)`
Quick check if a slab can be cut to fulfill a request (area check).

## Database Schema

**StockEntry:**
- `id`: Unique identifier
- `marbleId`: Reference to Marble
- `shade`: AA, A, B, or B-
- `quantity`: Total sq ft
- `slabSizeLength`: Length of each slab
- `slabSizeWidth`: Width of each slab
- `numberOfSlabs`: Number of slabs in this entry

**ReservedStock:**
- Similar structure to StockEntry
- Includes client information
- Status: Reserved, Released, Cancelled

## Example Allocation Result

For request: 3 slabs of 2ft x 2ft

```json
{
  "allocations": [
    {
      "stockEntryId": 123,
      "marbleId": 31,
      "shade": "A",
      "slabsUsed": 1,
      "quantityUsed": 12,
      "remainingSlabs": 5,
      "allocationType": "cut"
    }
  ],
  "totalQuantityAllocated": 12,
  "totalWaste": 4,
  "canFulfill": true
}
```

This means:
- Used 1 slab of 4ft x 4ft
- Got 3 pieces of 2ft x 2ft (12 sq ft)
- 5 slabs of 4ft x 4ft remain
- 4 sq ft of waste (1 unused 2ft x 2ft piece)

## Future Enhancements

1. **Advanced Cutting Patterns**: Track actual cut layouts and optimize cutting patterns
2. **Remnant Optimization**: Better algorithms for combining remnants
3. **Visual Cutting Plans**: Show how slabs will be cut
4. **Waste Minimization**: More sophisticated algorithms to minimize waste
5. **Multi-Orientation Cuts**: Handle complex cutting scenarios with multiple orientations
