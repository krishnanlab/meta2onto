from contextlib import contextmanager
from time import perf_counter

import sys

@contextmanager
def timed(label="Elapsed", print_method=print, flush=True):
    start = perf_counter()
    try:
        yield
    finally:
        elapsed = perf_counter() - start
        print_method(f"{label}: {elapsed:.3f} seconds")

        if flush:
            # if flush exists on print_method, call it to ensure immediate output
            if hasattr(print_method, "flush"):
                print_method.flush()
            # if it's just normal print, flush the standard output
            elif print_method == print:
                sys.stdout.flush()
