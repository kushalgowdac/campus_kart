# Frontend Professionalization Tasks (Step-by-Step)

1. Confirm API health
   - Verify backend is running and /api/users, /api/products respond.

2. Authentication UX (MVP)
   - Add login selector (done)
   - Add signup form (done)
   - Persist session in localStorage (done)

3. Data loading states
   - Add skeleton loaders for list cards.
   - Show empty-state cards when no products.

4. Product listing UX
   - Add product image carousel using prod_img.
   - Add product specs and locations (chips).
   - Add seller badge and inventory count.

5. Forms UX
   - Inline field validation (email format, min price, year bounds).
   - Disable submit buttons while loading.
   - Clear success toast on next edit.

6. Search & filter UX
   - Add dropdown filters: category, status.
   - Add quick preset filters (Books, Lab, Electronics).

7. Wishlist UX
   - Add “Add to wishlist” buttons on cards.
   - Show wishlist count per user.

8. Transactions UX
   - Add “Buy now” modal with quantity selector.
   - Show transaction success summary.

9. Layout polish
   - Responsive grid spacing.
   - Consistent typography scale.
   - Add top navigation and footer.

10. Quality
   - Add client-side error boundary.
   - Add linting + formatting.
   - Add simple unit tests for API layer.
