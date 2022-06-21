import cgi
import urllib
import logging

import ckan.plugins.toolkit as toolkit
from ckan.logic import schema as ckan_schema
from ckanext.rvr.helpers import is_valid_spatial

from ckanext.rvr.views.dataset import dataset_blueprint
from ckanext.rvr.views.organization import organization_blueprint
from ckanext.rvr import actions as rvrActions
from ckanext.rvr.commands import rvr_spatial
from ckanext.spatial.plugin import SpatialQuery

log = logging.getLogger(__name__)
config = toolkit.config
ignore_missing = toolkit.get_validator('ignore_missing')

import ckan.plugins as p
import ckan.lib.helpers as h

def get_newest_datasets():
    results = toolkit.get_action('current_package_list_with_resources')({},{"limit":5})
    return results
def get_nav_transport():
    link = h.literal(u'<a href="/{}">{}</a>'.format("verkehrsdaten", "Verkehrsdaten"))
    return h.literal("<li>")+ link + h.literal("</li>")

def get_specific_page(name=""):
    page_list = toolkit.get_action('ckanext_pages_list')(
        None, {
               'page_type': 'page'}
    )
    new_list = []
    for page in page_list:
        if page['name'] == name:
            new_list.append(page)
    return new_list

def build_pages_nav_main(*args):

    about_menu = toolkit.asbool(config.get('ckanext.pages.about_menu', True))
    group_menu = toolkit.asbool(config.get('ckanext.pages.group_menu', True))
    org_menu = toolkit.asbool(config.get('ckanext.pages.organization_menu', True))

    # Different CKAN versions use different route names - gotta catch em all!
    about_menu_routes = ['about', 'home.about']
    group_menu_routes = ['group_index', 'home.group_index']
    org_menu_routes = ['organizations_index', 'home.organizations_index']

    new_args = []
    for arg in args:
        if arg[0] in about_menu_routes and not about_menu:
            continue
        if arg[0] in org_menu_routes and not org_menu:
            continue
        if arg[0] in group_menu_routes and not group_menu:
            continue
        new_args.append(arg)

    output = h.build_nav_main(*new_args) 
    # do not display any private datasets in menu even for sysadmins
    pages_list = toolkit.get_action('ckanext_pages_list')(None, {'order': True, 'private': False})

    page_name = ''

    if (toolkit.c.action in ('pages_show', 'blog_show')
       and toolkit.c.controller == 'ckanext.pages.controller:PagesController'):
        page_name = toolkit.c.environ['routes.url'].current().split('/')[-1]
    output = output + get_nav_transport()
    for page in pages_list:
        type_ = 'blog' if page['page_type'] == 'blog' else 'pages'
        name = urllib.parse.quote(page['name'].encode('utf-8')) #.decode('utf-8')
        title = cgi.escape(page['title'])
        link = h.literal(u'<a href="/{}/{}">{}</a>'.format(type_, name, title))
        if page['name'] == page_name:
            li = h.literal('<li class="active">') + link + h.literal('</li>')
        else:
            li = h.literal('<li>') + link + h.literal('</li>')
        output = output + li

    return  output 

class RvrPlugin(p.SingletonPlugin, toolkit.DefaultDatasetForm):
    p.implements(p.IConfigurer)
    p.implements(p.ITemplateHelpers)
    p.implements(p.IDatasetForm)
    p.implements(p.IFacets, inherit=True)
    p.implements(p.IBlueprint)
    p.implements(p.IActions)

    schema_options = { 
        'default': [
            toolkit.get_validator('ignore_missing'),
            toolkit.get_converter('convert_to_extras')
        ],
        'not_empty': [toolkit.get_validator('not_empty')]
    }


    # IBlueprint
    def get_blueprint(self):
        return [
            dataset_blueprint
        ]

    # IConfigurer
    def get_helpers(self):
        '''Register the most_popular_groups() function above as a template
        helper function.

        '''
        # Template helper function names should begin with the name of the
        # extension they belong to, to avoid clashing with functions from
        # other extensions.
        return {
            'get_newest_datasets': get_newest_datasets,
            'build_nav_main': build_pages_nav_main,
            'get_specific_page': get_specific_page
        }

    def update_config(self, config_):
        toolkit.add_template_directory(config_, 'templates')
        toolkit.add_public_directory(config_, 'public')
        toolkit.add_resource('assets', 'rvr')

    def create_package_schema(self):
        # let's grab the default schema in our pluginWS
        schema = super(RvrPlugin, self).create_package_schema()
        # our custom field
        schema.update({
            'notes': self.schema_options['not_empty'],
            'owner_org': self.schema_options['not_empty'],
            'dataset_spatial': self.schema_options['default'],
            'spatial': self.schema_options['default']
        })
        return schema

    def update_package_schema(self):
        # let's grab the default schema in our plugin
        schema = super(RvrPlugin, self).update_package_schema()
        # our custom field
        schema.update({
            'notes': self.schema_options['not_empty'],
            'owner_org': self.schema_options['not_empty'],
            'dataset_spatial': self.schema_options['default'],
            'spatial': self.schema_options['default']
        })
        return schema

    def is_fallback(self):
        # Return True to register this plugin as the default handler for
        # package types not handled by any other IDatasetForm plugin.
        return True

    def package_types(self):
        # This plugin doesn't handle any special package types, it just
        # registers itself as the default (above).
        return []
    
    def dataset_facets(self, facets_dict, package_type):
        '''
        Override core search fasets for datasets
        '''
        facets_dict['date_filters'] = "Datumsfilter"
        return facets_dict

    # IActions
    def get_actions(self):
        '''
        Define custom functions (or override existing ones).
        Available via API /api/action/{action-name}
        '''
        return {
            'package_search': rvrActions.package_search,
            'package_show': rvrActions.package_show
        }


class RvrSpatialQueryPlugin(SpatialQuery, toolkit.DefaultOrganizationForm):
    p.implements(p.IGroupForm, inherit=True)
    p.implements(p.IClick)
    p.implements(p.ITemplateHelpers)

    # IClick
    def get_commands(self):
        return [rvr_spatial]

    # ITemplateHelpers
    def get_helpers(self):
        return {
            'is_valid_spatial': is_valid_spatial
        }

    # IBlueprint
    def get_blueprint(self):
        return [organization_blueprint]

    def is_fallback(self):
        return False

    def group_types(self):
        return ('organization',)

    # IGroupForm
    def form_to_db_schema(self):
        schema = ckan_schema.group_form_schema()
        schema.update({'org_spatial' : [toolkit.get_validator('ignore_missing'),
                                        toolkit.get_converter('convert_to_extras')]})
        return schema

    def db_to_form_schema(self):
        schema = ckan_schema.default_show_group_schema()
        schema.update({'org_spatial' : [toolkit.get_validator('ignore_missing'),
                                        toolkit.get_converter('convert_to_extras')]})
        return schema

    def group_form(self, group_type='organization'):
        return 'organization/snippets/organization_form.html'
