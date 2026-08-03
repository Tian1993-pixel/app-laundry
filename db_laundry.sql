-- ========================================================
-- DATABASE EXPORT FOR UNAUX CPANEL HOSTING (db_laundry.sql)
-- ========================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- 1. TABEL store_settings
CREATE TABLE IF NOT EXISTS `store_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `store_name` varchar(150) NOT NULL DEFAULT 'Laundry Fresh & Clean',
  `tagline` varchar(255) DEFAULT 'Solusi Pakaian Bersih, Rapi & Harum Premium',
  `address` text DEFAULT NULL,
  `phone` varchar(30) DEFAULT '081234567890',
  `logo_url` longtext DEFAULT NULL,
  `banner_url` longtext DEFAULT NULL,
  `header_receipt_note` varchar(255) DEFAULT 'Nota Resmi Pembayaran Laundry',
  `footer_receipt_note` varchar(255) DEFAULT 'Terima kasih telah mempercayakan pakaian Anda kepada kami!',
  `license_key` varchar(100) DEFAULT 'LND-2026-PREMIUM-OK',
  `license_active_until` date DEFAULT '2026-12-31',
  `is_active` tinyint(1) DEFAULT 1,
  `first_member_discount` int(11) DEFAULT 10000,
  `point_redeem_threshold` int(11) DEFAULT 10,
  `point_redeem_discount` int(11) DEFAULT 10000,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `store_settings` (`id`, `store_name`, `tagline`, `address`, `phone`, `logo_url`, `banner_url`, `header_receipt_note`, `footer_receipt_note`, `license_key`, `license_active_until`, `is_active`, `first_member_discount`, `point_redeem_threshold`, `point_redeem_discount`) VALUES
(1, 'Laundry Fresh & Clean', 'Solusi Pakaian Bersih, Rapi & Harum Premium', 'Jl. Raya Utama No. 12, Bandung', '081234567890', '/images/laundry_logo.png', '/images/laundry_hero_banner.png', 'Nota Resmi Pembayaran Laundry', 'Terima kasih telah mempercayakan pakaian Anda kepada kami!', 'LND-2026-PREMIUM-OK', '2026-12-31', 1, 10000, 10, 10000);

-- 2. TABEL outlets
CREATE TABLE IF NOT EXISTS `outlets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `store_name` varchar(150) NOT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `outlets` (`id`, `store_name`, `address`, `phone`, `is_active`) VALUES
(1, 'Laundry Fresh & Clean (Pusat)', 'Jl. Raya Utama No. 12, Bandung', '081234567890', 1),
(2, 'Laundry Fresh & Clean (Cabang Dago)', 'Jl. Ir. H. Juanda No. 88, Bandung', '081299881122', 1);

-- 3. TABEL reviews
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(100) NOT NULL,
  `rating` int(11) DEFAULT 5,
  `package_used` varchar(100) DEFAULT 'Paket Kiloan Reguler',
  `comment` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `reviews` (`id`, `customer_name`, `rating`, `package_used`, `comment`) VALUES
(1, 'Hendra Wijaya', 5, 'Paket Express Kilat', 'Cucian sangat wangi dan bersih. Penjemputannya tepat waktu dan harga terjangkau! Sangat direkomendasikan.'),
(2, 'Anisa Rahmawati', 5, 'Paket Satuan Bed Cover', 'Bedcover jumbo saya kembali seperti baru, sangat lembut dan packing plastiknya rapi banget.'),
(3, 'Bambang Kusuma', 5, 'Paket Kiloan Reguler', 'Sudah langganan 6 bulan di sini. Poin reward-nya lumayan banget bisa ditukar diskon!');

-- 4. TABEL services
CREATE TABLE IF NOT EXISTS `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_name` varchar(150) NOT NULL,
  `category` varchar(50) DEFAULT 'kiloan',
  `price` int(11) NOT NULL,
  `unit` varchar(20) DEFAULT 'kg',
  `duration_hours` int(11) DEFAULT 24,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `services` (`id`, `service_name`, `category`, `price`, `unit`, `duration_hours`) VALUES
(1, 'Cuci Komplit Reguler', 'kiloan', 7000, 'kg', 48),
(2, 'Cuci Komplit Express 24 jam', 'express', 12000, 'kg', 24),
(3, 'Setrika Saja (Kiloan)', 'kiloan', 4500, 'kg', 24),
(4, 'Bed Cover Besar (Jumbo)', 'satuan', 35000, 'pcs', 48),
(5, 'Cuci Sepatu Sneaker', 'satuan', 30000, 'pasang', 48),
(6, 'Jas / Gaun Pesta Premium', 'satuan', 40000, 'pcs', 72),
(7, 'Cuci Karpet Tebal', 'satuan', 15000, 'm2', 72),
(8, 'Gorden & Tirai', 'satuan', 12000, 'meter', 48);

-- 5. TABEL customers
CREATE TABLE IF NOT EXISTS `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `password` varchar(100) DEFAULT '123',
  `address` text DEFAULT NULL,
  `points` int(11) DEFAULT 0,
  `deposit_balance` int(11) DEFAULT 0,
  `is_first_order` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `customers` (`id`, `name`, `phone`, `password`, `address`, `points`, `deposit_balance`, `is_first_order`) VALUES
(1, 'Budi Santoso', '081299887766', '123', 'Jl. Merdeka No. 5', 12, 150000, 0),
(2, 'Siti Aminah', '085711223344', '123', 'Komp. Mawar Indah B-3', 4, 0, 1),
(3, 'Rina Permata', '081344556677', '123', 'Jl. Melati No. 8', 0, 50000, 1);

-- 6. TABEL orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `customer_name` varchar(150) NOT NULL,
  `customer_phone` varchar(30) DEFAULT NULL,
  `subtotal_amount` int(11) DEFAULT 0,
  `discount_amount` int(11) DEFAULT 0,
  `shipping_fee` int(11) DEFAULT 0,
  `other_fee` int(11) DEFAULT 0,
  `total_amount` int(11) NOT NULL,
  `paid_amount` int(11) DEFAULT 0,
  `change_amount` int(11) DEFAULT 0,
  `payment_type` varchar(30) DEFAULT 'cash',
  `payment_status` varchar(30) DEFAULT 'paid',
  `work_status` varchar(50) DEFAULT 'diterima',
  `rack_location` varchar(50) DEFAULT 'RAK A-01',
  `perfume_variant` varchar(50) DEFAULT 'Original Fresh',
  `notes` text DEFAULT NULL,
  `created_at` varchar(100) DEFAULT NULL,
  `items_json` longtext DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
