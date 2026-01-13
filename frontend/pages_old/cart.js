useEffect(() => {
  getCart().catch(() => {
    router.push("/login?next=/cart");
  });
}, []);
