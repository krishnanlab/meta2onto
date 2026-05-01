"""
Previously, I tried generating a token using the pyrefinebio package, but importing the package
raises the following:

    ModuleNotFoundError .../pyrefinebio/api_interface.py", line 5, in <module>
        from pyrate_limiter import Duration, Limiter, RequestRate
    ModuleNotFoundError: No module named 'pyrate_limiter'

I saw this recent issue: https://github.com/AlexsLemonade/refinebio-py/issues/90 explaining that you
need to install pyrate_limiter<3 to fix this. After installing that, the pyrefinebio package imports
properly.

"""

import requests


def post_token():
    """Recieve an API token from refine.bio."""
    response = requests.post("https://api.refine.bio/v1/token/")
    token_id = response.json()["id"]
    response = requests.put(
        "https://api.refine.bio/v1/token/" + token_id + "/",
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
        "https://api.refine.bio/v1/dataset/",
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

    # Can use pyrefinebio or the API. Prefer API
    # import pyrefinebio
    # token = pyrefinebio.create_token(agree_to_terms=True, save_token=True)

    token = post_token()
    result = post_dataset(data, token)

    print("token:", token)
    print("dataset:", result)


if __name__ == "__main__":
    main()
