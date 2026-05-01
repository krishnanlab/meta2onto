"""
Previously, I tried generating a token using the pyrefinebio package, but importing the package
raises the following:

    ModuleNotFoundError .../pyrefinebio/api_interface.py", line 5, in <module>
        from pyrate_limiter import Duration, Limiter, RequestRate
    ModuleNotFoundError: No module named 'pyrate_limiter'

I saw this recent issue: https://github.com/AlexsLemonade/refinebio-py/issues/90 explaining that you
need to install pyrate_limiter<3 to fix this. After installing that, the pyrefinebio package imports
properly.

Questions:
    - How many tokens are required?
    - Is there a limit for the number of datasets a token can create or maintain at a time?


Author: Parker Hicks
Date: 2026-05-01

"""

import requests

API_TOKEN_URL = "https://api.refine.bio/v1/token/"
API_DATASET_URL = "https://api.refine.bio/v1/dataset/"

DATA_CART_URL = "https://www.refine.bio/dataset/"


def post_token():
    """Recieve an API token from refine.bio."""
    response = requests.post(API_TOKEN_URL)
    token_id = response.json()["id"]
    response = requests.put(
        API_TOKEN_URL + token_id + "/",
        json={"is_activated": True},
    )

    return token_id


def post_dataset(data: dict[str, list[str]], token: str):
    """Initialize a datacart on refine.bio.

    Arguments:
        data (dict[str, list[str]]):
            Dictionary of experiment -> sample IDs (e.g., {SRPxxx1: [SRRxxx1, SRRxxx2, ...]}).
        token (str):
            refine.bio API token.

    """
    response = requests.post(
        API_DATASET_URL,
        json={
            "data": data,
            "email_ccdl_ok": False,
            "notify_me": False,
        },
        headers={"API_TOKEN": token},
    )
    response.raise_for_status()
    return response.json()


def main():
    data = {"SRP081083": ["SRR4011226", "SRR4011227", "SRR4011228", "SRR4011229"]}

    # If you add a study ID that is not in refine.bio, it throws an error:
    # requests.exceptions.HTTPError: 400 Client Error: Bad Request for url: https://api.refine.bio/v1/dataset/
    # Try with data below:
    # data = {
    #    "SRP081083": ["SRR4011226", "SRR4011227", "SRR4011228", "SRR4011229"],
    #    "test": ["not_in_dataset1", "not_in_dataset2"],
    # }

    # Can use pyrefinebio or the API to create a token. Prefer API
    # import pyrefinebio
    # token = pyrefinebio.create_token(agree_to_terms=True, save_token=True)

    token = post_token()
    result = post_dataset(data, token)

    print("token:", token)
    print("dataset:", result)
    print("")
    print(f"populated data cart available at {DATA_CART_URL}{result['id']}")


if __name__ == "__main__":
    main()
