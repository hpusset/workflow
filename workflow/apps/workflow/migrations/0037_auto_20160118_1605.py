# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('workflow', '0036_auto_20160118_1604'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='changelog',
            options={'ordering': ['-created_at'], 'verbose_name': 'Changelog', 'verbose_name_plural': 'Changelog'},
        ),
    ]
