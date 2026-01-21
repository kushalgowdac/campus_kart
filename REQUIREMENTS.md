# CampusKart Requirements Specification (ER-Aligned)

## Hardware Requirements
**Client**
- Laptop/desktop or mobile device with internet access.

**Server**
- Multi-core CPU
- 4+ GB RAM (8+ GB recommended)
- SSD storage

## Software Requirements
**Client**
- Modern web browser (Chrome, Firefox, Edge, Safari)

**Server**
- Node.js (Express)
- MySQL 8.x
- Optional: MongoDB (for chat only)

## Functional Requirements
### User Management
- The system shall register users with `name`, `email`, and `password`.
- The system shall allow listing, updating, and deleting users.

### Product Management
- The system shall allow creating products with fields: `pname`, `category`, `price`, `status`, `bought_year`, `preferred_for`, `no_of_copies`.
- The system shall support filtering products by `category`, `status`, and seller.

### Seller Mapping
- The system shall map each product to a seller using `product_seller`.

### Product Specifications
- The system shall allow storing multiple specifications per product using key-value pairs.

### Product Images
- The system shall allow storing multiple image URLs per product.

### Product Locations
- The system shall allow storing multiple pickup locations per product.

### Wishlist
- The system shall allow users to add and remove items from a wishlist.

### Transactions
- The system shall record purchases in the `transaction` table with `buyerid`, `pid`, `quantity`, `status`, and timestamp.
- The system shall decrement inventory (`no_of_copies`) on purchase and mark a product as `sold` when quantity reaches zero.

## Non-Functional Requirements
- **Data integrity**: Enforced via foreign keys and constraints.
- **Performance**: Use indexes on product and transaction lookups.
- **Security**: Input validation, least-privilege DB user, and environment-based credentials.

## Out of Scope
- Payments and delivery logistics are not part of the ER-aligned core.
- Chat is optional and stored outside the core ER model if used.
