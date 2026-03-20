#!/usr/bin/env python3
"""Test script to identify import and runtime errors"""

import sys
import traceback

modules_to_test = [
    'app',
    'app.main',
    'app.database',
    'app.config',
    'app.routes.chat_routes',
    'app.routes.session_routes',
    'app.routes.evaluation_routes',
    'app.services.chat_service',
    'app.services.session_service',
    'app.services.evaluation_service',
    'app.schemas.session_schema',
    'app.schemas.chat_schema',
    'app.evaluation.pillar_g',
    'app.evaluation.pillar_u',
    'app.evaluation.pillar_i',
    'app.evaluation.pillar_d',
    'app.evaluation.pillar_e',
]

errors = []
for module_path in modules_to_test:
    try:
        __import__(module_path)
        print(f"✓ {module_path}")
    except Exception as e:
        error_msg = f"✗ {module_path}: {type(e).__name__}: {str(e)[:150]}"
        errors.append((module_path, e))
        print(error_msg)
        # Uncomment to see full traceback:
        # traceback.print_exc()

if errors:
    print(f"\n\n❌ {len(errors)} IMPORT/RUNTIME ERRORS FOUND:\n")
    for module, err in errors:
        print(f"\n[{module}]")
        print(f"  Error Type: {type(err).__name__}")
        print(f"  Message: {str(err)}")
else:
    print("\n\n✅ ALL MODULES IMPORTED SUCCESSFULLY")
    sys.exit(0)

sys.exit(1)
