import json

from django.contrib.auth.decorators import login_required
from django.db.models.loading import get_model
from django.http import HttpResponse

@login_required
def djpi_autocomplete(request):

    if request.method == 'GET':
        model = request.GET.get('model')
        field = request.GET.get('field')
        query_string = request.GET.get('query_string')
        kwarg = {'{0}__icontains'.format(field): query_string}
        model_path = get_model('smp', model)
        pk = model_path._meta.pk.name
        list_query_set = model_path.objects.values_list(pk, field).filter(**kwarg)

        data = []
        for row in list_query_set:
            data_row = {
                pk: row[0],
                field: row[1]
            }
            data.append(data_row)

        response_obj = {
            "msg_type": "success",
            "msg": "Data found",
            "data": data
        }

    else:
        response_obj = {
            "msg_type": "error",
            "msg": "Invalid request method",
            "data": []
        }

    return HttpResponse(
        json.dumps(response_obj),
        content_type="application/json"
    )

