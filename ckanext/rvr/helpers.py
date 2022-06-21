import json

from sqlalchemy.sql import select
from sqlalchemy import and_
from ckan.logic import get_action
import ckan.model as model

context = {
    'model': model,
    'session': model.Session,
    'ignore_auth': True
}

def is_valid_spatial(spatial: str) -> bool:
    try:
        spatial_dict = json.loads(spatial)
        if spatial_dict['type'].lower() != 'polygon':
            return False
        if type(spatial_dict['coordinates']) != type([]):
            return False
        del spatial_dict
        return True
    except:
        return False

def get_org_spatial(org_id: str, context: dict = context) -> str:
    org_dict = get_action(u'organization_show')(context,
        {u'id': org_id, u'include_datasets': False}
    )
    org_spatial = ''
    for extra in org_dict.get('extras', []):
        if extra.get('key') == 'org_spatial':
            org_spatial = extra.get('value')
    return org_spatial

def all_package_list(include_private: bool = True):
    """
    Like ckan's package_list but returns only private packages which are \
    dataset types.

    Only compatible with ckan 2.9.x

    Args:
        include_private (bool, optional): include private datasets. Defaults to True.
    """
    package_table = model.package_table
    col = (package_table.c.name)
    query = select([col])
    if include_private:
        query = query.where(and_(
            package_table.c.state == 'active',
            package_table.c.type == 'dataset'
        ))
    else:
        return get_action('package_list')(context, {})
    query = query.order_by(col)

    ## Returns the first field in each result record
    return [r[0] for r in query.execute()]
