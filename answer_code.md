# Answer Code — Easy 5-Function Calculator

Copy and paste this into the editor:

```python
history = []


def _is_invalid(a, b):
    return (
        a is None
        or b is None
        or isinstance(a, bool)
        or isinstance(b, bool)
        or not isinstance(a, (int, float))
        or not isinstance(b, (int, float))
    )


def add(a, b):
    if _is_invalid(a, b):
        return "invalid"
    return a + b


def subtract(a, b):
    if _is_invalid(a, b):
        return "invalid"
    return a - b


def multiply(a, b):
    if _is_invalid(a, b):
        return "invalid"
    return a * b


def divide(a, b):
    if _is_invalid(a, b):
        return "invalid"
    if b == 0:
        return "inf"
    return a / b


def percent(a, b):
    if _is_invalid(a, b):
        return "invalid"
    if b == 0:
        return "inf"
    return a % b
```
