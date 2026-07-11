/**
 * Squad by GTBank payment gateway
 * POST /api/squad/verify        — verify book purchase
 * POST /api/squad/verify-donation — verify donation
 *
 * Docs: https://squadinc.gitbook.io/squad-api-documentation
 */
const express = require('express');
const router  = express.Router();
const axios   = require('axios');
const Book    = require('../Book');

const SQUAD_SECRET  = process.env.SQUAD_SECRET_KEY || '';
const SQUAD_BASE    = process.env.SQUAD_ENV === 'live'
  ? 'https://api.squadco.com'
  : 'https://sandbox-api-d.squadco.com';

// ── Helper: verify transaction with Squad ───────────────────────────────────
async function verifyRef(reference) {
  if (!SQUAD_SECRET) throw new Error('Squad secret key not configured on server.');
  const res = await axios.get(
    `${SQUAD_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${SQUAD_SECRET}` } }
  );
  const txn = res.data?.data;
  if (!txn || txn.transaction_status !== 'success') {
    throw new Error('Payment not confirmed by Squad.');
  }
  return txn;
}

// ── Book purchase verification ──────────────────────────────────────────────
router.post('/verify', async (req, res) => {
  const { reference, bookId } = req.body;
  if (!reference || !bookId) return res.status(400).json({ error: 'reference and bookId are required.' });
  try {
    const txn  = await verifyRef(reference);
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ error: 'Book not found.' });
    res.json({
      success:     true,
      downloadUrl: book.downloadUrl,
      bookTitle:   book.title,
      amountPaid:  txn.transaction_amount / 100,
      reference:   txn.transaction_ref,
      paidAt:      txn.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed: ' + (err.response?.data?.message || err.message) });
  }
});

// ── Donation verification ───────────────────────────────────────────────────
router.post('/verify-donation', async (req, res) => {
  const { reference } = req.body;
  if (!reference) return res.status(400).json({ error: 'reference is required.' });
  try {
    const txn = await verifyRef(reference);
    res.json({
      success:    true,
      amountPaid: txn.transaction_amount / 100,
      reference:  txn.transaction_ref,
      paidAt:     txn.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed: ' + (err.response?.data?.message || err.message) });
  }
});

module.exports = router;
