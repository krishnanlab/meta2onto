def dictfetchall(cursor):
    """
    Given a cursor, maps the results to a list of dictionaries.
    
    :param cursor: Database cursor after executing a query.
    :return: List of dictionaries representing the query results.
    """
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]
