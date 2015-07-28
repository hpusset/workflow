#!/usr/bin/env python
# -*- coding: utf-8 -*-

from django import forms
from .models import Project, WorkflowInstance, ItemModel, ItemInstance, ItemCategory, Comment


class ProjectNewForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = ['name', 'team', 'items']

    choices = []
    for cat in ItemCategory.objects.order_by('name'):
        queryset = ItemModel.objects.filter(category=cat).order_by('name')
        choices_tmp = [(c.pk, c.name) for c in queryset]
        choices.append((cat.name, choices_tmp))

    items = forms.MultipleChoiceField(
        choices=choices,
        widget=forms.CheckboxSelectMultiple,
        required=False,
    )


class ItemModelNewForm(forms.ModelForm):
    class Meta:
        model = ItemModel
        fields = ['name', 'description', 'category']


class ItemInstanceNewForm(forms.ModelForm):
    class Meta:
        model = ItemInstance
        fields = ['item_model', 'assigned_to', 'validation']


class CommentNewForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['text']


class ItemDetailForm(forms.ModelForm):
    class Meta:
        model = ItemModel
        fields = ['description']
