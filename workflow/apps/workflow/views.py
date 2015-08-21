#!/usr/bin/env python
# -*- coding: utf-8 -*-
# The MIT License (MIT)
# Copyright (c) 2015 Findspire

from collections import OrderedDict

from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.core.urlresolvers import reverse, reverse_lazy
from django.forms.models import model_to_dict
from django.http.response import HttpResponseRedirect, Http404
from django.shortcuts import render, get_object_or_404

from braces.views import LoginRequiredMixin

from workflow.utils.generic_views import CreateUpdateView, MyListView
from workflow.apps.workflow.models import Comment, Item, ItemModel, ItemCategory, Project, Workflow
from workflow.apps.workflow.forms import CommentNewForm, ItemDetailForm, ProjectNewForm


@login_required
def index(request):
    return render(request, 'workflow/index.haml')


class ProjectFormView(LoginRequiredMixin, CreateUpdateView):
    model = Project
    form_class = ProjectNewForm
    success_url = reverse_lazy('workflow:project_list')
    template_name = 'utils/workflow_generic_views_form.haml'

    def dispatch(self, *args, **kwargs):
        if not self.request.user.is_superuser:
            raise PermissionDenied
        return super(ProjectFormView, self).dispatch(*args, **kwargs)

    def form_valid(self, form):
        ret = super(ProjectFormView, self).form_valid(form)
        self.object.items = form.cleaned_data['items']
        self.object.save()
        return ret


@login_required
def project_list(request):
    context = {
        'projects': {project:Workflow.objects.filter(project=project) for project in Project.objects.all()}
    }
    return render(request, 'workflow/project_list.haml', context)


class WorkflowFormView(LoginRequiredMixin, CreateUpdateView):
    model = Workflow
    fields = ['project', 'version']
    template_name = 'utils/workflow_generic_views_form.haml'

    def dispatch(self, *args, **kwargs):
        if not self.request.user.is_superuser:
            raise PermissionDenied
        return super(WorkflowFormView, self).dispatch(*args, **kwargs)


@login_required
def workflow_show(request, workflow_pk, which_display):
    displays = ('all', 'mine', 'untested', 'success', 'failed', 'untaken', 'taken')

    if which_display not in displays:
        raise Http404('Unexpected display "%s"' % which_display)

    request_person = request.user.person
    workflow = get_object_or_404(Workflow, pk=workflow_pk)
    team = workflow.project.team

    if (not request_person in team.members.all()) and (request_person != team.leader):
        raise PermissionDenied

    # group by category
    items_list = workflow.get_items(which_display, request_person)

    items_dic = OrderedDict()
    for item in items_list:
        category = item.item_model.category
        items_dic.setdefault(category, [])
        items_dic[category].append(item)

    context = {
        'workflow': workflow,
        'counters': {display: workflow.get_count(display, request_person) for display in displays},
        'items': items_dic,
        'Item': Item,
        'which_display': which_display,
    }

    return render(request, 'workflow/workflow_show.haml', context)


class ItemModelFormView(LoginRequiredMixin, CreateUpdateView):
    model = ItemModel
    fields = ['name', 'category', 'description']
    success_url = reverse_lazy('workflow:item_model_list')
    template_name = 'utils/workflow_generic_views_form.haml'


class ItemModelFormViewFromWorkflow(ItemModelFormView):
    def form_valid(self, form):
        ret = super(ItemModelFormViewFromWorkflow, self).form_valid(form)

        # add to newly created ItemModel to the projects and the workflow
        created = form.instance

        workflow = get_object_or_404(Workflow, pk=self.kwargs['workflow_pk'])
        Item.objects.create(item_model=created, workflow=workflow)

        project = workflow.project
        project.items.add(created)

        return ret

    def get_success_url(self):
        workflow_pk = self.kwargs['workflow_pk']
        return reverse_lazy('workflow:workflow_show', args=[workflow_pk, 'all'])


class ItemCategoryFormView(LoginRequiredMixin, CreateUpdateView):
    model = ItemCategory
    fields = ['name']
    success_url = reverse_lazy('workflow:item_model_list')
    template_name = 'utils/workflow_generic_views_form.haml'


@login_required
def item_instance_show(request, item_pk):
    item = get_object_or_404(Item.objects.select_related(), pk=item_pk)

    # default
    form_comment = CommentNewForm()
    form_description = ItemDetailForm(initial=model_to_dict(item.item_model))

    if request.method == 'POST':
        if request.POST['type'] == 'comment':
            form_comment = CommentNewForm(request.POST)
            if form_comment.is_valid():
                c = Comment()
                c.item = item
                c.person = request.user.person
                c.text = form_comment.cleaned_data['text']
                c.save()
                return HttpResponseRedirect(reverse('workflow:item_instance_show', args=[item.pk]))
        elif request.POST['type'] == 'description':
            form_description = ItemDetailForm(request.POST, initial=model_to_dict(item.item_model))
            if form_description.is_valid():
                item.item_model.description = form_description.cleaned_data['description']
                item.item_model.save()
                return HttpResponseRedirect(reverse('workflow:item_instance_show', args=[item.pk]))

    context = {
        'item': item,
        'comments': Comment.objects.filter(item=item).select_related(),
        'form_comment': form_comment,
        'form_description': form_description,
        'Item': Item,
    }

    return render(request, 'workflow/item_instance_show.haml', context)


@login_required
def update(request, action, model, pk, pk_other=None):
    # todo: this should be a POST request

    if model == 'item':
        item = get_object_or_404(Item, pk=pk)
        workflow_pk = item.workflow.pk

        if action == 'take':
            item.assigned_to = request.user.person
        elif action == 'untake':
            item.assigned_to = None
        else:
            raise Http404('Unexpected action "%s"' % action)

        item.save()

    elif model == 'category':
        workflow_pk = pk_other

        if action == 'take':
            assigned_to = request.user.person
        elif action == 'untake':
            assigned_to = None
        elif action == 'show':
            pass  # use with ajax when adding a new item, this way we refresh the whole category
        else:
            raise Http404('Unexpected action "%s"' % action)

        if (action == 'take') or (action == 'untake'):
            items = get_object_or_404(Workflow, pk=pk_other).get_items('all').filter(item_model__category__pk=int(pk))
            items.update(assigned_to=assigned_to)

    elif model == 'validate':
        item = get_object_or_404(Item, pk=pk)
        workflow_pk = item.workflow.pk

        if action == 'untested':
            item.validation = Item.VALIDATION_UNTESTED
        elif action == 'success':
            item.validation = Item.VALIDATION_SUCCESS
        elif action == 'failed':
            item.validation = Item.VALIDATION_FAILED
        else:
            raise Http404('Unexpected action "%s"' % action)

        item.save()

    else:
        raise Http404('Unexpected model "%s"' % model)

    # response

    if request.is_ajax():
        if model == 'item':
            context = {
                'item': get_object_or_404(Item, pk=pk),
            }
            return render(request, 'workflow/workflow_show.take_untake.part.haml', context)
        elif model == 'category':
            workflow = get_object_or_404(Workflow, pk=workflow_pk)
            items = workflow.get_items('all').filter(item_model__category__pk=int(pk))

            context = {
                'category': get_object_or_404(ItemCategory, pk=pk),
                'items_list': items,
                'workflow': workflow,
                'Item': Item,
            }
            return render(request, 'workflow/workflow_show.table.part.haml', context)
        elif model == 'validate':
            context = {
                'item': get_object_or_404(Item, pk=pk),
                'Item': Item,
            }
            return render(request, 'workflow/workflow_show.validate.part.haml', context)
    else:
        default_url = reverse('workflow:workflow_show', args=[workflow_pk, 'all'])
        return HttpResponseRedirect(request.GET.get('next', default_url))


class ItemModelListView(LoginRequiredMixin, MyListView):
    model = ItemModel
    paginate_by = 15
    queryset = ItemModel.objects.order_by('-category').select_related('category')
