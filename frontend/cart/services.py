from functools import reduce

def calculate_total(cart_items):
    return reduce(
        lambda total, item: total + item.product.price * item.quantity,
        cart_items,
        0
    )
