"""
Celery application configuration and tasks.
"""
from celery import Celery
from celery.schedules import crontab
from loguru import logger

from app.core.config import settings


# Create Celery app
celery_app = Celery(
    'urbancore',
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

# Configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour
    task_soft_time_limit=3300,  # 55 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=100,
)

# Periodic tasks schedule
celery_app.conf.beat_schedule = {
    'cleanup-old-logs': {
        'task': 'app.tasks.maintenance.cleanup_old_logs',
        'schedule': crontab(hour=2, minute=0),  # Run at 2 AM daily
    },
    'refresh-statistics': {
        'task': 'app.tasks.maintenance.refresh_statistics',
        'schedule': crontab(hour='*/6'),  # Every 6 hours
    },
}


@celery_app.task(name='app.tasks.satellite.download_sentinel2_task')
def download_sentinel2_task(project_id: int, bbox: list, years: list):
    """
    Download Sentinel-2 imagery for a project.
    
    Args:
        project_id: Project ID
        bbox: Bounding box [west, south, east, north]
        years: List of years to download
    """
    from app.services.satellite.downloader import SatelliteDownloader
    from app.db.session import SessionLocal
    from app.models.project import Project, ProjectStatus
    
    db = SessionLocal()
    try:
        # Update project status
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            logger.error(f"Project {project_id} not found")
            return
        
        project.status = ProjectStatus.DOWNLOADING
        db.commit()
        
        logger.info(f"Starting satellite download for project {project_id}")
        
        # Download imagery
        downloader = SatelliteDownloader()
        output_dir = f"{settings.TEMP_DIR}/projects/{project_id}/satellite"
        
        results = downloader.download_multi_year(bbox, years, output_dir)
        
        # Save results to database
        # (Implementation for saving satellite images to database)
        
        project.status = ProjectStatus.PROCESSING
        db.commit()
        
        logger.info(f"Satellite download completed for project {project_id}")
        
        return {
            'success': True,
            'project_id': project_id,
            'results': results
        }
    
    except Exception as e:
        logger.error(f"Error downloading satellite imagery: {e}")
        project.status = ProjectStatus.FAILED
        project.error_message = str(e)
        db.commit()
        raise
    
    finally:
        db.close()


@celery_app.task(name='app.tasks.detection.run_building_detection_task')
def run_building_detection_task(project_id: int, image_id: int):
    """
    Run building detection on an image.
    
    Args:
        project_id: Project ID
        image_id: Satellite image ID
    """
    from app.services.detection.building_detector import BuildingDetector
    from app.db.session import SessionLocal
    from app.models.image import SatelliteImage
    
    db = SessionLocal()
    try:
        logger.info(f"Starting building detection for image {image_id}")
        
        # Get image
        image = db.query(SatelliteImage).filter(SatelliteImage.id == image_id).first()
        if not image:
            logger.error(f"Image {image_id} not found")
            return
        
        # Run detection
        detector = BuildingDetector()
        output_mask_path = f"{settings.TEMP_DIR}/projects/{project_id}/predictions/mask_{image_id}.tif"
        
        results = detector.detect_buildings(
            image.processed_image_path,
            output_mask_path,
            confidence_threshold=0.5,
            min_area_sqm=25.0
        )
        
        # Save results to database
        # (Implementation for saving predictions and buildings to database)
        
        logger.info(f"Building detection completed for image {image_id}")
        
        return {
            'success': True,
            'image_id': image_id,
            'num_buildings': results['num_buildings'],
            'total_area_sqm': results['total_area_sqm']
        }
    
    except Exception as e:
        logger.error(f"Error in building detection: {e}")
        raise
    
    finally:
        db.close()


@celery_app.task(name='app.tasks.violation.check_violations_task')
def check_violations_task(project_id: int):
    """
    Check all buildings in project for violations.
    
    Args:
        project_id: Project ID
    """
    from app.services.violation.violation_checker import ViolationChecker
    from app.db.session import SessionLocal
    from app.models.building import Building
    
    db = SessionLocal()
    try:
        logger.info(f"Starting violation check for project {project_id}")
        
        # Get buildings
        buildings = db.query(Building).filter(Building.project_id == project_id).all()
        
        # Load restriction layers (implementation needed)
        restriction_layers = {}  # Load from database or GIS files
        
        # Check violations
        checker = ViolationChecker()
        total_violations = 0
        
        for building in buildings:
            building_dict = {
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': []  # Extract from database
                }
            }
            
            violations = checker.check_violations(building_dict, restriction_layers)
            total_violations += len(violations)
            
            # Save violations to database
            # (Implementation for saving violations)
        
        logger.info(f"Violation check completed: {total_violations} violations found")
        
        return {
            'success': True,
            'project_id': project_id,
            'total_violations': total_violations
        }
    
    except Exception as e:
        logger.error(f"Error checking violations: {e}")
        raise
    
    finally:
        db.close()


@celery_app.task(name='app.tasks.reports.generate_report_task')
def generate_report_task(report_id: int):
    """
    Generate PDF report.
    
    Args:
        report_id: Report ID
    """
    from app.db.session import SessionLocal
    from app.models.report import Report, ReportStatus
    
    db = SessionLocal()
    try:
        logger.info(f"Starting report generation for report {report_id}")
        
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            logger.error(f"Report {report_id} not found")
            return
        
        report.status = ReportStatus.GENERATING
        db.commit()
        
        # Generate PDF report (implementation needed)
        # pdf_path = generate_pdf_report(report)
        
        # Update report
        # report.pdf_path = pdf_path
        report.status = ReportStatus.COMPLETED
        db.commit()
        
        logger.info(f"Report generation completed for report {report_id}")
        
        return {
            'success': True,
            'report_id': report_id
        }
    
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        report.status = ReportStatus.FAILED
        report.error_message = str(e)
        db.commit()
        raise
    
    finally:
        db.close()


@celery_app.task(name='app.tasks.maintenance.cleanup_old_logs')
def cleanup_old_logs():
    """Clean up old log entries."""
    from app.db.session import SessionLocal
    from app.models.log import SystemLog
    from datetime import datetime, timedelta
    
    db = SessionLocal()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        deleted = db.query(SystemLog).filter(SystemLog.created_at < cutoff_date).delete()
        db.commit()
        
        logger.info(f"Cleaned up {deleted} old log entries")
        return {'deleted_count': deleted}
    
    finally:
        db.close()


@celery_app.task(name='app.tasks.maintenance.refresh_statistics')
def refresh_statistics():
    """Refresh materialized views and statistics."""
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    try:
        db.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY project_statistics")
        db.commit()
        
        logger.info("Statistics refreshed successfully")
        return {'success': True}
    
    finally:
        db.close()
