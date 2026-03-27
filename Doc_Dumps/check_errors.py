#!/usr/bin/env python3
"""Comprehensive error detection and validation script"""

import sys
import os  
import ast
import re

project_root = "/Project/Current/Final_Year_Project/Interview_with_AI"
issues = []

def check_python_syntax(filepath):
    """Check Python file for syntax errors"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            code = f.read()
        ast.parse(code)
        return []
    except SyntaxError as e:
        return [{
            'file': filepath,
            'type': 'SyntaxError',
            'line': e.lineno,
            'message': str(e)
        }]
    except Exception as e:
        return [{
            'file': filepath,
            'type': type(e).__name__,
            'message': str(e)
        }]

def check_undefined_variables(filepath):
    """Detect obvious undefined variable references"""
    errors = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Simple checks for common patterns
        for i, line in enumerate(lines, 1):
            # Check for undefined variables in f-strings
            if 'f"' in line or "f'" in line:
                # Look for undefined variable patterns like {var}
                matches = re.findall(r'\{(\w+)\}', line)
                # This is a simplistic check, might have false positives
                
    except Exception as e:
        pass
    
    return errors

def check_files():
    """Check all Python files in app directory"""
    app_dir = "app"
    all_errors = []
    
    for root, dirs, files in os.walk(app_dir):
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                syntax_errors = check_python_syntax(filepath)
                if syntax_errors:
                    all_errors.extend(syntax_errors)
    
    return all_errors

if __name__ == '__main__':
    print("🔍 Scanning Python files for errors...\n")
    
    errors = check_files()
    
    if errors:
        print(f"❌ Found {len(errors)} error(s):\n")
        for err in errors:
            print(f"  [{err['file']}:{err.get('line', '?')}]")
            print(f"    Type: {err['type']}")
            print(f"    Message: {err['message']}\n")
        sys.exit(1)
    else:
        print("✅ No syntax errors found in Python files!")
        print("\n✓ All Python files are syntactically valid")
        sys.exit(0)
