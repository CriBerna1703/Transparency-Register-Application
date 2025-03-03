-- MySQL dump 10.13  Distrib 8.0.39, for Win64 (x86_64)
--
-- Host: localhost    Database: lobbistidb
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `commission_meetings`
--

DROP TABLE IF EXISTS `commission_meetings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commission_meetings` (
  `lobbyist_id` varchar(50) NOT NULL,
  `meeting_number` int NOT NULL,
  `meeting_date` date DEFAULT NULL,
  `topic` text,
  `representative_id` int DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`lobbyist_id`,`meeting_number`),
  KEY `representative_id` (`representative_id`),
  CONSTRAINT `commission_meetings_ibfk_1` FOREIGN KEY (`lobbyist_id`) REFERENCES `lobbyist_profile` (`lobbyist_id`) ON DELETE CASCADE,
  CONSTRAINT `commission_meetings_ibfk_2` FOREIGN KEY (`representative_id`) REFERENCES `commission_representative` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_meetings`
--

LOCK TABLES `commission_meetings` WRITE;
/*!40000 ALTER TABLE `commission_meetings` DISABLE KEYS */;
/*!40000 ALTER TABLE `commission_meetings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commission_representative`
--

DROP TABLE IF EXISTS `commission_representative`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commission_representative` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_representative`
--

LOCK TABLES `commission_representative` WRITE;
/*!40000 ALTER TABLE `commission_representative` DISABLE KEYS */;
/*!40000 ALTER TABLE `commission_representative` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directorate`
--

DROP TABLE IF EXISTS `directorate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directorate` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directorate`
--

LOCK TABLES `directorate` WRITE;
/*!40000 ALTER TABLE `directorate` DISABLE KEYS */;
/*!40000 ALTER TABLE `directorate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fields_of_interest`
--

DROP TABLE IF EXISTS `fields_of_interest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fields_of_interest` (
  `field_id` int NOT NULL AUTO_INCREMENT,
  `field_name` varchar(255) DEFAULT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`field_id`),
  UNIQUE KEY `field_name` (`field_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fields_of_interest`
--

LOCK TABLES `fields_of_interest` WRITE;
/*!40000 ALTER TABLE `fields_of_interest` DISABLE KEYS */;
/*!40000 ALTER TABLE `fields_of_interest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lobbyist_fields_of_interest`
--

DROP TABLE IF EXISTS `lobbyist_fields_of_interest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lobbyist_fields_of_interest` (
  `lobbyist_id` varchar(50) NOT NULL,
  `field_id` int NOT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`lobbyist_id`,`field_id`),
  KEY `field_id` (`field_id`),
  CONSTRAINT `lobbyist_fields_of_interest_ibfk_1` FOREIGN KEY (`lobbyist_id`) REFERENCES `lobbyist_profile` (`lobbyist_id`) ON DELETE CASCADE,
  CONSTRAINT `lobbyist_fields_of_interest_ibfk_2` FOREIGN KEY (`field_id`) REFERENCES `fields_of_interest` (`field_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lobbyist_fields_of_interest`
--

LOCK TABLES `lobbyist_fields_of_interest` WRITE;
/*!40000 ALTER TABLE `lobbyist_fields_of_interest` DISABLE KEYS */;
/*!40000 ALTER TABLE `lobbyist_fields_of_interest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lobbyist_memberships`
--

DROP TABLE IF EXISTS `lobbyist_memberships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lobbyist_memberships` (
  `lobbyist_id` varchar(50) NOT NULL,
  `membership_id` int NOT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`lobbyist_id`,`membership_id`),
  KEY `membership_id` (`membership_id`),
  CONSTRAINT `lobbyist_memberships_ibfk_1` FOREIGN KEY (`lobbyist_id`) REFERENCES `lobbyist_profile` (`lobbyist_id`) ON DELETE CASCADE,
  CONSTRAINT `lobbyist_memberships_ibfk_2` FOREIGN KEY (`membership_id`) REFERENCES `memberships` (`membership_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lobbyist_memberships`
--

LOCK TABLES `lobbyist_memberships` WRITE;
/*!40000 ALTER TABLE `lobbyist_memberships` DISABLE KEYS */;
/*!40000 ALTER TABLE `lobbyist_memberships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lobbyist_profile`
--

DROP TABLE IF EXISTS `lobbyist_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lobbyist_profile` (
  `lobbyist_id` varchar(50) NOT NULL,
  `organization_name` varchar(255) DEFAULT NULL,
  `registration_number` varchar(50) DEFAULT NULL,
  `registration_status` varchar(50) DEFAULT NULL,
  `registration_date` datetime DEFAULT NULL,
  `last_update_date` datetime DEFAULT NULL,
  `next_update_date` datetime DEFAULT NULL,
  `acronym` varchar(255) DEFAULT NULL,
  `entity_form` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `head_office_address` text,
  `head_office_phone` varchar(50) DEFAULT NULL,
  `eu_office_address` text,
  `eu_office_phone` varchar(50) DEFAULT NULL,
  `legal_representative` varchar(255) DEFAULT NULL,
  `legal_representative_role` varchar(255) DEFAULT NULL,
  `eu_relations_representative` varchar(255) DEFAULT NULL,
  `eu_relations_representative_role` varchar(255) DEFAULT NULL,
  `transparency_register_url` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`lobbyist_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lobbyist_profile`
--

LOCK TABLES `lobbyist_profile` WRITE;
/*!40000 ALTER TABLE `lobbyist_profile` DISABLE KEYS */;
/*!40000 ALTER TABLE `lobbyist_profile` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lobbyist_proposals`
--

DROP TABLE IF EXISTS `lobbyist_proposals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lobbyist_proposals` (
  `lobbyist_id` varchar(50) NOT NULL,
  `proposal_id` int NOT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`lobbyist_id`,`proposal_id`),
  KEY `proposal_id` (`proposal_id`),
  CONSTRAINT `lobbyist_proposals_ibfk_1` FOREIGN KEY (`lobbyist_id`) REFERENCES `lobbyist_profile` (`lobbyist_id`) ON DELETE CASCADE,
  CONSTRAINT `lobbyist_proposals_ibfk_2` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`proposal_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lobbyist_proposals`
--

LOCK TABLES `lobbyist_proposals` WRITE;
/*!40000 ALTER TABLE `lobbyist_proposals` DISABLE KEYS */;
/*!40000 ALTER TABLE `lobbyist_proposals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `memberships`
--

DROP TABLE IF EXISTS `memberships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `memberships` (
  `membership_id` int NOT NULL AUTO_INCREMENT,
  `membership_name` text,
  `membership_lobbyist_id` varchar(50) DEFAULT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`membership_id`),
  KEY `membership_lobbyist_id` (`membership_lobbyist_id`),
  CONSTRAINT `memberships_ibfk_1` FOREIGN KEY (`membership_lobbyist_id`) REFERENCES `lobbyist_profile` (`lobbyist_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `memberships`
--

LOCK TABLES `memberships` WRITE;
/*!40000 ALTER TABLE `memberships` DISABLE KEYS */;
/*!40000 ALTER TABLE `memberships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proposals`
--

DROP TABLE IF EXISTS `proposals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proposals` (
  `proposal_id` int NOT NULL AUTO_INCREMENT,
  `proposal_description` text NOT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`proposal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proposals`
--

LOCK TABLES `proposals` WRITE;
/*!40000 ALTER TABLE `proposals` DISABLE KEYS */;
/*!40000 ALTER TABLE `proposals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `representative_allocation`
--

DROP TABLE IF EXISTS `representative_allocation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `representative_allocation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `representative_id` int NOT NULL,
  `year` int NOT NULL,
  `directorate_id` int NOT NULL,
  `role` varchar(255) DEFAULT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `representative_id` (`representative_id`),
  KEY `directorate_id` (`directorate_id`),
  CONSTRAINT `representative_allocation_ibfk_1` FOREIGN KEY (`representative_id`) REFERENCES `commission_representative` (`id`) ON DELETE CASCADE,
  CONSTRAINT `representative_allocation_ibfk_2` FOREIGN KEY (`directorate_id`) REFERENCES `directorate` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `representative_allocation`
--

LOCK TABLES `representative_allocation` WRITE;
/*!40000 ALTER TABLE `representative_allocation` DISABLE KEYS */;
/*!40000 ALTER TABLE `representative_allocation` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-01-27  9:32:49
