import starlette.testclient as _tc

_original_client_init = _tc.Client.__init__
_original_testclient_init = _tc.TestClient.__init__

def _patched_client_init(self, *args, **kwargs):
    # Allow 'app' kw for compatibility
    if 'app' in kwargs:
        app = kwargs.pop('app')
        _original_client_init(self, app, *args, **kwargs)
    else:
        _original_client_init(self, *args, **kwargs)

def _patched_testclient_init(self, app=None, *args, **kwargs):
    # Support passing app as keyword or positional
    if app is None:
        app = kwargs.pop('app', None)
    _original_testclient_init(self, app, *args, **kwargs)

_tc.Client.__init__ = _patched_client_init
_tc.TestClient.__init__ = _patched_testclient_init
