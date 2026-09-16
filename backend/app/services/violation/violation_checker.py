"""
Violation detection service.
"""
from typing import List, Dict, Tuple
from shapely.geometry import shape, Point, Polygon
from shapely.ops import unary_union
import numpy as np
from loguru import logger


class ViolationChecker:
    """Check buildings against zoning regulations and protected areas."""
    
    def __init__(self):
        """Initialize violation checker."""
        self.violation_types = {}
    
    def check_violations(
        self,
        building: Dict,
        restriction_layers: Dict[str, List[Dict]]
    ) -> List[Dict]:
        """
        Check building for violations against all restriction layers.
        
        Args:
            building: Building geometry and metadata
            restriction_layers: Dictionary of restriction layer name -> geometries
        
        Returns:
            List of violations found
        """
        violations = []
        building_geom = shape(building['geometry'])
        
        # Check river buffer violation
        if 'rivers' in restriction_layers:
            violation = self._check_buffer_violation(
                building_geom,
                restriction_layers['rivers'],
                buffer_distance_m=100.0,
                violation_code='RIVER_BUF',
                violation_name='River Buffer Violation',
                severity='high'
            )
            if violation:
                violations.append(violation)
        
        # Check flood zone violation
        if 'flood_zones' in restriction_layers:
            violation = self._check_zone_violation(
                building_geom,
                restriction_layers['flood_zones'],
                violation_code='FLOOD_ZONE',
                violation_name='Flood Zone Violation',
                severity='critical'
            )
            if violation:
                violations.append(violation)
        
        # Check forest boundary violation
        if 'forests' in restriction_layers:
            violation = self._check_buffer_violation(
                building_geom,
                restriction_layers['forests'],
                buffer_distance_m=50.0,
                violation_code='FOREST_BND',
                violation_name='Forest Boundary Violation',
                severity='critical'
            )
            if violation:
                violations.append(violation)
        
        # Check green belt violation
        if 'green_belts' in restriction_layers:
            violation = self._check_zone_violation(
                building_geom,
                restriction_layers['green_belts'],
                violation_code='GREEN_BELT',
                violation_name='Green Belt Violation',
                severity='high'
            )
            if violation:
                violations.append(violation)
        
        # Check CRZ violation
        if 'crz_zones' in restriction_layers:
            violation = self._check_zone_violation(
                building_geom,
                restriction_layers['crz_zones'],
                violation_code='CRZ',
                violation_name='Coastal Regulation Zone Violation',
                severity='critical'
            )
            if violation:
                violations.append(violation)
        
        # Check protected area violation
        if 'protected_areas' in restriction_layers:
            violation = self._check_zone_violation(
                building_geom,
                restriction_layers['protected_areas'],
                violation_code='PROTECTED',
                violation_name='Protected Area Violation',
                severity='critical'
            )
            if violation:
                violations.append(violation)
        
        # Check road setback violation
        if 'roads' in restriction_layers:
            violation = self._check_buffer_violation(
                building_geom,
                restriction_layers['roads'],
                buffer_distance_m=5.0,
                violation_code='ROAD_SETBACK',
                violation_name='Road Setback Violation',
                severity='medium'
            )
            if violation:
                violations.append(violation)
        
        return violations
    
    def _check_buffer_violation(
        self,
        building_geom: Polygon,
        restriction_features: List[Dict],
        buffer_distance_m: float,
        violation_code: str,
        violation_name: str,
        severity: str
    ) -> Dict | None:
        """
        Check if building violates buffer zone.
        
        Args:
            building_geom: Building geometry
            restriction_features: List of restriction feature geometries
            buffer_distance_m: Buffer distance in meters
            violation_code: Violation code
            violation_name: Violation name
            severity: Severity level
        
        Returns:
            Violation dict if found, None otherwise
        """
        try:
            # Create union of all restriction geometries
            restriction_geoms = [shape(f['geometry']) for f in restriction_features]
            restriction_union = unary_union(restriction_geoms)
            
            # Convert buffer distance from meters to degrees (approximate)
            buffer_degrees = buffer_distance_m / 111320.0
            
            # Create buffer
            buffered = restriction_union.buffer(buffer_degrees)
            
            # Check intersection
            if building_geom.intersects(buffered):
                # Calculate distance to nearest restriction
                distance_m = building_geom.distance(restriction_union) * 111320.0
                
                # Calculate overlap
                overlap_geom = building_geom.intersection(buffered)
                overlap_area_sqm = overlap_geom.area * 111320 * 111320
                overlap_percentage = (overlap_area_sqm / (building_geom.area * 111320 * 111320)) * 100
                
                return {
                    'violation_code': violation_code,
                    'violation_name': violation_name,
                    'severity': severity,
                    'description': f'Building located within {buffer_distance_m}m buffer zone',
                    'distance_to_zone_m': distance_m,
                    'buffer_distance_m': buffer_distance_m,
                    'overlap_area_sqm': overlap_area_sqm,
                    'overlap_percentage': overlap_percentage
                }
            
            return None
        
        except Exception as e:
            logger.error(f"Error checking buffer violation: {e}")
            return None
    
    def _check_zone_violation(
        self,
        building_geom: Polygon,
        zone_features: List[Dict],
        violation_code: str,
        violation_name: str,
        severity: str
    ) -> Dict | None:
        """
        Check if building is within restricted zone.
        
        Args:
            building_geom: Building geometry
            zone_features: List of zone feature geometries
            violation_code: Violation code
            violation_name: Violation name
            severity: Severity level
        
        Returns:
            Violation dict if found, None otherwise
        """
        try:
            # Create union of all zone geometries
            zone_geoms = [shape(f['geometry']) for f in zone_features]
            zone_union = unary_union(zone_geoms)
            
            # Check if building intersects zone
            if building_geom.intersects(zone_union):
                # Calculate overlap
                overlap_geom = building_geom.intersection(zone_union)
                overlap_area_sqm = overlap_geom.area * 111320 * 111320
                building_area_sqm = building_geom.area * 111320 * 111320
                overlap_percentage = (overlap_area_sqm / building_area_sqm) * 100
                
                return {
                    'violation_code': violation_code,
                    'violation_name': violation_name,
                    'severity': severity,
                    'description': f'Building located within restricted {violation_name.lower()}',
                    'distance_to_zone_m': 0.0,
                    'overlap_area_sqm': overlap_area_sqm,
                    'overlap_percentage': overlap_percentage
                }
            
            return None
        
        except Exception as e:
            logger.error(f"Error checking zone violation: {e}")
            return None
    
    def calculate_violation_summary(self, violations: List[Dict]) -> Dict:
        """
        Calculate summary statistics for violations.
        
        Args:
            violations: List of violations
        
        Returns:
            Summary statistics
        """
        if not violations:
            return {
                'total': 0,
                'by_severity': {},
                'by_type': {},
                'critical_count': 0,
                'high_count': 0,
                'medium_count': 0,
                'low_count': 0
            }
        
        by_severity = {}
        by_type = {}
        
        for violation in violations:
            severity = violation['severity']
            v_type = violation['violation_code']
            
            by_severity[severity] = by_severity.get(severity, 0) + 1
            by_type[v_type] = by_type.get(v_type, 0) + 1
        
        return {
            'total': len(violations),
            'by_severity': by_severity,
            'by_type': by_type,
            'critical_count': by_severity.get('critical', 0),
            'high_count': by_severity.get('high', 0),
            'medium_count': by_severity.get('medium', 0),
            'low_count': by_severity.get('low', 0)
        }
