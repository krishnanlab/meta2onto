from django.core.management.base import BaseCommand
from django.db import connection, transaction


class Command(BaseCommand):
    help = "Normalize database names to this set: Refine.bio, ARCHS4, Recount3, GEO, SRA, BioStudies, BioProject, ArrayExpress, Peptidome"

    def handle(self, *args, **options):
        with transaction.atomic(), connection.cursor() as cursor:
            for table in ('api_geoseriesdatabase', 'api_externaldbrefs'):
                # Update the database names in the studies table
                self.stdout.write(f"Normalizing database names in table: {table}")
                cursor.execute(f"""
                    UPDATE {table}
                    SET database = CASE
                        WHEN database ILIKE 'refine.bio' THEN 'Refine.bio'
                        WHEN database ILIKE 'archs4' THEN 'ARCHS4'
                        WHEN database ILIKE 'recount3' THEN 'Recount3'
                        WHEN database ILIKE 'geo' THEN 'GEO'
                        WHEN database ILIKE 'sra' THEN 'SRA'
                        WHEN database ILIKE 'biostudies' THEN 'BioStudies'
                        WHEN database ILIKE 'bioproject' THEN 'BioProject'
                        WHEN database ILIKE 'arrayexpress' THEN 'ArrayExpress'
                        WHEN database ILIKE 'peptidome' THEN 'Peptidome'
                        ELSE database
                    END
                """)

        self.stdout.write(self.style.SUCCESS("Database names normalized successfully."))
