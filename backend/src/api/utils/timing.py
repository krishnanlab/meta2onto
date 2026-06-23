from contextlib import contextmanager
from time import perf_counter

@contextmanager
def timed(label="Elapsed", print_method=print):
    start = perf_counter()
    try:
        yield
    finally:
        elapsed = perf_counter() - start
        print_method(f"{label}: {elapsed:.3f} seconds")
