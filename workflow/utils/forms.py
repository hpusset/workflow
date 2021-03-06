#!/usr/bin/env python
# -*- coding: utf-8 -*-
# The MIT License (MIT)
# Copyright (c) 2015 Findspire

from django import forms


class MyCheckboxFieldRenderer(forms.widgets.CheckboxFieldRenderer):
    """Add the html label tag for further css and js styling"""
    inner_html = u'<li><label>{choice_value}</label>{sub_widgets}</li>'


class MyCheckboxSelectMultiple(forms.widgets.CheckboxSelectMultiple):
    renderer = MyCheckboxFieldRenderer


class MyMultipleChoiceField(forms.MultipleChoiceField):
    """Implement a nested MultipleChoiceField."""

    widget = MyCheckboxSelectMultiple

    def get_choices(self):
        category, obj = self.choices_data
        choices = []
        for cat in category.objects.order_by('name'):
            queryset = obj.objects.filter(category=cat).order_by('name')
            choices_tmp = [(c.pk, c.name.encode('utf-8')) for c in queryset]
            choices.append((cat.name.encode('utf-8'), choices_tmp))
        return choices

    # Overriding __init__ in order to build a nested list of choices (sorted by categories)
    def __init__(self, choices_data, *args, **kwargs):
        self.choices_data = choices_data
        super(MyMultipleChoiceField, self).__init__(choices=self.get_choices, *args, **kwargs)
