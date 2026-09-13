import React from 'react';
import { Card, CardContent, CardHeader, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper } from '@mui/material';

const ProductsTable = ({ items }) => {
  return (
    <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
      <CardHeader title="Products" sx={{ '& .MuiCardHeader-title': { fontWeight: 700 } }} />
      <Divider />
      <CardContent>
        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Selling Price</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Line Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center' }}>
                    <Typography color="text.secondary">No products available for this invoice.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={item.productId || index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.productName || item.product || '-'}</TableCell>
                    <TableCell>{item.quantity ?? 0}</TableCell>
                    <TableCell>{item.sellingPrice != null ? `₹${Number(item.sellingPrice).toLocaleString('en-IN')}` : '-'}</TableCell>
                    <TableCell>{item.discount != null ? `₹${Number(item.discount).toLocaleString('en-IN')}` : '-'}</TableCell>
                    <TableCell>{item.lineTotal != null ? `₹${Number(item.lineTotal).toLocaleString('en-IN')}` : '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default ProductsTable;
