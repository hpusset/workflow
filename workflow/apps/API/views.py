# -*- coding: utf-8 -*-
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from django.shortcuts import get_object_or_404
from workflow.apps.API import serializers
from django.contrib.auth.models import User
from workflow.apps.workflow.models import Item, Comment, Workflow


class CsrfExemptSessionAuthentication(SessionAuthentication):

    def enforce_csrf(self, request):
        return  # To not perform the csrf check previously happening


class CommentList(APIView):
    """
    Display comment list
    """
    def get(self, request, item_pk, format=None):
        """
        Display comment list of selected item
        ---
        response_serializer: serializers.CommentSerializer
        """
        comments = Comment.objects.filter(item__pk=item_pk)
        serializer = serializers.CommentSerializer(comments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TakeItem(APIView):
    """
    Take item to request user
    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    def put(self, request, username, item_pk, format=None):
        """
        Assign selected item to username
        ---
        request_serializer: serializers.ItemSerializer
        response_serializer: serializers.ItemSerializer
        """
        item = get_object_or_404(Item, pk=item_pk)
        user = get_object_or_404(User, username=username)
        if item.assigned_to == None:
            item.assigned_to = user.person
            item.assigned_to_name_cache = user.username
            serializer = serializers.ItemSerializer(item, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_403_FORBIDDEN)
        return Response(status=status.HTTP_403_FORBIDDEN)


class UntakeItem(APIView):
    """
    Untake item
    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    def put(self, request, item_pk, format=None):
        """
        Untake item
        ---
        request_serializer: serializers.ItemSerializer
        response_serializer: serializers.ItemSerializer
        """
        item = get_object_or_404(Item, pk=item_pk)
        if item.assigned_to is not None:
            item.assigned_to = None
            item.assigned_to_name_cache = None
            serializer = serializers.ItemSerializer(item, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_403_FORBIDDEN)


class WorkflowDetails(APIView):
    """
    Retrieve or update details of selected workflow
    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    def get(self, request, workflow_pk, format=None):
        """
        Retrieve details of selected workflow
        ---
        response_serializer: serializers.WorkflowSerializer
        """
        workflow = get_object_or_404(Workflow, pk=workflow_pk)
        serializer = serializers.WorkflowSerializer(workflow)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, workflow_pk, format=None):
        """
        Update informations of selected workflow
        ---
        request_serializer: serializers.WorkflowSerializer
        response_serializer: serializers.WorkflowSerializer
        """
        workflow = get_object_or_404(Workflow, pk=workflow_pk)
        serializer = serializers.WorkflowSerializer(workflow, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)