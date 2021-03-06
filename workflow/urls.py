#!/usr/bin/env python
# -*- coding: utf-8 -*-
# The MIT License (MIT)
# Copyright (c) 2015 Findspire

from django.conf.urls import include, url
from django.contrib import admin
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect


@login_required
def index(request):
    return redirect('dashboard:index')


urlpatterns = [
    url(r'^admin/', include(admin.site.urls)),
    url(r'^i18n/', include('django.conf.urls.i18n')),

    url(r'^$', index),
    url(r'^dashboard/', include('workflow.apps.dashboard.urls', namespace='dashboard')),
    url(r'^workflow/', include('workflow.apps.workflow.urls', namespace='workflow')),
    url(r'^team/', include('workflow.apps.team.urls', namespace='team')),
    url(r'^api/', include('workflow.apps.API.urls', namespace='api')),
]
