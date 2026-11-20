# Change Detail Feature - Audit & Implementation Plan

## AUDIT FINDINGS

### A. Cell Representation Analysis

**Current Implementation:**
1. **Grid Structure**: 40×40 grid (`DEFAULT_SIZE = 40` in `gridFromGeojson.ts`)
2. **Cell Classes**: `"land"` (green), `"existing"` (orange), `"new"` (red)
3. **Mapping**: Row/col coordinate system (0-39 for 40×40 grid)
4. **3D Scene**: `GridBlocks.tsx` uses THREE.InstancedMesh with per-instance:
   - Position: `(col - half, height/2, row - half)`
   - Height: Dynamic based on cell class (`CLASS_HEIGHT` in `colors.ts`)
   - Color: Based on class and `changesOnly` mode
   - Pulse animation for "new" cells

**Cell Data Structure (from `api/types.ts`):**
```typescript
interface GridCell {
  row: number;
  col: number;
  class: CellClass;  // "land" | "existing" | "new"
  height: number;    // 0..1 relative height hint
}
```

**Instance ID → Cell Mapping:**
- `instanceId = cell.row * grid.cols + cell.col`
- Count = 1600 cells (40×40)

### B. Backend Endpoints Analysis

**Available Endpoints:**
1. `GET /api/v1/analyses/{analysis_id}` - Full analysis record
   - Returns `inference_results` per year with construction percentage/pixels
   - Contains GeoJSON paths but NOT per-cell data

2. `GET /api/v1/analyses/{analysis_id}/results/{year}` - Year results
   - Returns inference and visualization data
   - Still no per-cell granularity

3. `GET /api/v1/analyses/{analysis_id}/geojson/{year}/{file_type}`
   - Returns GeoJSON FeatureCollection with polygons
   - `file_type`: "inference" (building polygons) or "visualization" (categories)
   - Each feature has polygon geometry with coordinates, category, and value

**Missing Backend Data:**
- ❌ No per-cell endpoints (row/col, id, coordinates)
- ❌ No bulk changed cells endpoint
- ❌ No per-cell before/after imagery URLs
- ❌ No per-cell coordinates/bbox data
- ❌ No per-cell confidence scores
- ❌ No per-cell change year tracking (when became "new")

### C. Image Source Decision

**Priority Analysis:**
1. ❌ **Backend imagery URLs per cell**: NOT AVAILABLE
2. ❌ **Coordinates/bbox per cell**: NOT AVAILABLE (only polygon-level coordinates)
3. ✅ **Generate from real imagery**: 
   - Backend has `downloads` paths for satellite imagery per year
   - Example: `C:\...\analyses\{id}\downloads\urbancore_{id}_{year}.tif`
   - Can crop based on cell's grid position within analysis bounds
4. ✅ **Schematic fallback**: Always available

**Decision:**
- Use **schematic representation** as primary
- Optionally implement imagery generation as enhancement
- Must label generated imagery as "AI-generated preview"

### D. Field Mapping & Scaling

**Frontend-Only Solution Required:**

**Cell Identification:**
- `cellId`: `R{row}-C{col}` (e.g., "R7-C9")
- `row`: 0-39, `col`: 0-39

**Data Derivation (from frontend state):**
1. **Cell State per Year**: From `grid.cells` array
2. **Change Year**: Find when cell first became "new" (scan `grids` per year)
3. **Before/After Years**: 
   - Before = last year cell was NOT "new"
   - After = first year cell IS "new"
4. **Coordinates**: Approximate using analysis bounds + grid position
5. **Confidence**: Not available, show "—"
6. **Area**: Use grid cell size (bounds area / 1600)

**Imagery Strategy:**
- **Schematic**: Show cell class colors with footprint
- **Option**: Generate imagery from satellite downloads (requires bounds calculation)
- Always label: "No imagery available" or "AI-generated preview"

**Scaling to All Cells:**
- Works for 1600 cells (40×40 grid)
- Per-cell data derived from existing `grids` array
- No additional backend calls needed
- Imagery generation can be lazy/optional

## BACKEND GAPS

### Critical Missing Data:
1. **Per-cell metadata**: Row/col, coordinates, bbox, confidence
2. **Cell history**: When each cell transitioned to "new"
3. **Bulk endpoint**: All changed cells for a year
4. **Imagery references**: Before/after image URLs or tiles per cell

### Frontend-Only Workarounds:
1. **Derive from grids**: Reconstruct per-cell history from yearly `grid.cells`
2. **Coordinate approximation**: Use analysis bounds + grid interpolation
3. **Schematic visualization**: Use class colors instead of real imagery
4. **Local caching**: Store derived cell data in client state

### Limitation Statement:
"Change detail feature operates entirely on frontend-derived data. It shows schematic representations of changes based on detected construction polygons. Real before/after satellite imagery is not available per cell in the current backend implementation."

## IMPLEMENTATION APPROACH

### Phase 1: Audit Complete ✓
### Phase 2: Frontend-Only Implementation

**Core Components:**
1. `useCellChange(cellId, year)` - Derives cell history from `grids`
2. `useNewCells(year)` - Filters grid.cells for "new" class
3. `CellSelection` - Raycasting on InstancedMesh
4. `ChangeDetailPanel` - Schematic visualization with stats
5. `CellNavigator` - Prev/Next navigation

**Data Flow:**
```
GridBlocks (3D) → Cell Selection → CellChange Hook → ChangeDetailPanel
     ↓                         ↓                      ↓
GridCells array          Cell History            Schematic View
```

**Non-Breaking**: All data exists in current frontend state, no backend modifications required.