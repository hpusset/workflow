#!/usr/bin/env python
# -*- coding: utf-8 -*-
# The MIT License (MIT)
# Copyright (c) 2015 Findspire

"""
Django settings for workflow project.

Generated by 'django-admin startproject' using Django 1.8.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.8/ref/settings/
"""

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.8/howto/deployment/checklist/

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
from django.utils.translation import ugettext_lazy as _

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

COMP_STRENGTH_DEFAULT = 5

###############################
# Dev vs Prod options
###############################

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '6og(!94ejbbv6x($=gn&amp;x3ea9ffb!64ev4%3jv(m*uy8-0@f=5'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

USE_X_FORWARDED_HOST = True

APPEND_SLASH = True

ADMINS = ()
MANAGERS = ADMINS

################################
# Internationalization
# https://docs.djangoproject.com/en/1.8/topics/i18n/
################################

USE_I18N = True

USE_L10N = True

USE_TZ = True

LANGUAGE_CODE = 'en'

LANGUAGES = (
    ('en', _('English')),
    ('fr', _('French')),
)
AVAILABLE_LANGUAGES = dict(LANGUAGES).keys()

LOCALE_PATHS = (
    os.path.join(BASE_DIR, 'workflow', 'locale'),
)

TIME_ZONE = 'UTC'

SITE_ID = 1

##################################
# Files location
##################################

MEDIA_ROOT = ''
MEDIA_URL = ''

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.8/howto/static-files/
STATIC_ROOT = os.path.join(BASE_DIR, 'static')
STATIC_URL = '/static/'

STATICFILES_DIRS = [
    BASE_DIR + '/workflow/static',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR + '/workflow/templates/',
        ],
        'OPTIONS': {
            'context_processors': [
                'django.contrib.auth.context_processors.auth',
                'django.template.context_processors.debug',
                'django.template.context_processors.i18n',
                'django.template.context_processors.media',
                'django.core.context_processors.request',
                'django.template.context_processors.static',
                'django.template.context_processors.tz',
                'django.contrib.messages.context_processors.messages',
            ],
            'loaders': [
                'hamlpy.template.loaders.HamlPyFilesystemLoader',
                'hamlpy.template.loaders.HamlPyAppDirectoriesLoader',
                'django.template.loaders.filesystem.Loader',
                'django.template.loaders.app_directories.Loader',
            ]
        },
    },
]

STATICFILES_STORAGE = 'whitenoise.django.GzipManifestStaticFilesStorage'

##################################
# Misc
##################################

DEBUG_TOOLBAR_PANELS = [
    #'debug_toolbar.panels.versions.VersionsPanel',
    'debug_toolbar.panels.timer.TimerPanel',
    #'debug_toolbar.panels.settings.SettingsPanel',
    'debug_toolbar.panels.headers.HeadersPanel',
    'debug_toolbar.panels.sql.SQLPanel',
    'debug_toolbar.panels.request.RequestPanel',
    'debug_toolbar.panels.staticfiles.StaticFilesPanel',
    'debug_toolbar.panels.templates.TemplatesPanel',
    'debug_toolbar.panels.cache.CachePanel',
    #'debug_toolbar.panels.signals.SignalsPanel',
    #'debug_toolbar.panels.logging.LoggingPanel',
    #'debug_toolbar.panels.redirects.RedirectsPanel',

    # third-party
    'template_profiler_panel.panels.template.TemplateProfilerPanel',
]

INSTALLED_APPS = (
    # django
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',

    # third party + debug
    'django_user_agents',

    'debug_toolbar',
    'template_profiler_panel',
    'django_extensions',

    # custom
    'workflow.apps.workflow',
    'workflow.apps.team',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',  # first
    'django.middleware.csrf.CsrfViewMiddleware',  # random
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',  # after session
    'django.contrib.auth.middleware.AuthenticationMiddleware',  # after session
    'django.middleware.locale.LocaleMiddleware',  # after session
    'django.middleware.clickjacking.XFrameOptionsMiddleware',

    'django_user_agents.middleware.UserAgentMiddleware',
)

ROOT_URLCONF = 'workflow.urls'

WSGI_APPLICATION = 'workflow.wsgi.application'

HAMLPY_ATTR_WRAPPER = '"'

LOGIN_URL = '/admin/login'

BUG_TRACKER_URL = 'https://redmine.findspire.com/issues/'

############################################
# Database
# https://docs.djangoproject.com/en/1.8/ref/settings/#databases
############################################

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.dirname(__file__) + '/../workflow.db',
    }
}
