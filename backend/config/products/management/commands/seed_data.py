from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Seed initial product data'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Seeding data...'))
