-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: lobbistidb
-- ------------------------------------------------------
-- Server version	8.0.44

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
-- Table structure for table `commission_cabinet`
--

DROP TABLE IF EXISTS `commission_cabinet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commission_cabinet` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=659 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_cabinet`
--

LOCK TABLES `commission_cabinet` WRITE;
/*!40000 ALTER TABLE `commission_cabinet` DISABLE KEYS */;
/*!40000 ALTER TABLE `commission_cabinet` ENABLE KEYS */;
UNLOCK TABLES;

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
  `location` varchar(255) DEFAULT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`lobbyist_id`,`meeting_number`),
  CONSTRAINT `commission_meetings_ibfk_1` FOREIGN KEY (`lobbyist_id`) REFERENCES `lobbyist_profile` (`lobbyist_id`) ON DELETE CASCADE
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
) ENGINE=InnoDB AUTO_INCREMENT=3187 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=3673 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fields_of_interest`
--

LOCK TABLES `fields_of_interest` WRITE;
/*!40000 ALTER TABLE `fields_of_interest` DISABLE KEYS */;
INSERT INTO `fields_of_interest` VALUES (1,'Azione per il clima','2025-08-12 17:40:27'),(2,'Comunicazione','2025-08-12 17:40:27'),(3,'Concorrenza','2025-08-12 17:40:27'),(4,'Cultura','2025-08-12 17:40:27'),(5,'Cultura e media','2025-08-12 17:40:27'),(6,'Economia e società digitali','2025-08-12 17:40:27'),(7,'Gioventù','2025-08-12 17:40:27'),(8,'Giustizia e diritti fondamentali','2025-08-12 17:40:27'),(9,'Istruzione e formazione','2025-08-12 17:40:27'),(10,'Mercato unico','2025-08-12 17:40:27'),(11,'Migrazione e asilo','2025-08-12 17:40:27'),(12,'Occupazione e affari sociali','2025-08-12 17:40:27'),(13,'Politica regionale','2025-08-12 17:40:27'),(14,'Prevenzione delle frodi','2025-08-12 17:40:27'),(15,'Relazioni esterne','2025-08-12 17:40:27'),(16,'Ricerca e innovazione','2025-08-12 17:40:27'),(17,'Salute pubblica','2025-08-12 17:40:27'),(18,'Sport','2025-08-12 17:40:27'),(19,'Affari marittimi e pesca','2025-08-12 17:52:29'),(20,'Agricoltura e sviluppo rurale','2025-08-12 17:52:29'),(21,'Ambiente','2025-08-12 17:52:29'),(22,'Commercio','2025-08-12 17:52:29'),(23,'Energia','2025-08-12 17:52:29'),(24,'Fiscalità','2025-08-12 17:52:29'),(25,'Imprese e industria','2025-08-12 17:52:29'),(26,'Reti Transeuropee','2025-08-12 17:52:29'),(27,'Trasporti','2025-08-12 17:52:29'),(28,'Servizi bancari e finanziari','2025-08-12 17:52:30'),(29,'Consumatori','2025-08-12 17:52:31'),(30,'Cooperazione internazionale e sviluppo','2025-08-12 17:52:31'),(31,'Sicurezza alimentare','2025-08-12 17:52:31'),(32,'Affari istituzionali','2025-08-12 17:52:32'),(33,'Bilancio','2025-08-12 17:52:32'),(34,'Affari esteri e politica di sicurezza','2025-08-12 17:52:36'),(35,'Aiuti umanitari e protezione civile','2025-08-12 17:52:37'),(36,'Dogane','2025-08-12 17:52:37'),(37,'Allargamento','2025-08-12 17:52:38'),(38,'Economia, finanze e l\'euro','2025-08-12 17:52:38'),(39,'Frontiere e sicurezza','2025-08-12 17:52:40'),(40,'Politica europea di vicinato','2025-08-12 17:52:49');
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
  `annual_cost_estimate_min` bigint DEFAULT NULL,
  `annual_cost_estimate_max` bigint DEFAULT NULL,
  `category_of_registration` varchar(255) DEFAULT NULL,
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
-- Table structure for table `meeting_representatives`
--

DROP TABLE IF EXISTS `meeting_representatives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_representatives` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lobbyist_id` varchar(50) NOT NULL,
  `meeting_number` int NOT NULL,
  `representative_id` int NOT NULL,
  `cabinet_id` int DEFAULT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lobbyist_id` (`lobbyist_id`,`meeting_number`),
  KEY `representative_id` (`representative_id`),
  KEY `cabinet_id` (`cabinet_id`),
  CONSTRAINT `meeting_representatives_ibfk_1` FOREIGN KEY (`lobbyist_id`, `meeting_number`) REFERENCES `commission_meetings` (`lobbyist_id`, `meeting_number`) ON DELETE CASCADE,
  CONSTRAINT `meeting_representatives_ibfk_2` FOREIGN KEY (`representative_id`) REFERENCES `commission_representative` (`id`) ON DELETE CASCADE,
  CONSTRAINT `meeting_representatives_ibfk_3` FOREIGN KEY (`cabinet_id`) REFERENCES `commission_cabinet` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=94272 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_representatives`
--

LOCK TABLES `meeting_representatives` WRITE;
/*!40000 ALTER TABLE `meeting_representatives` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_representatives` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=42017 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=397619 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=17248 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `representative_allocation`
--

LOCK TABLES `representative_allocation` WRITE;
/*!40000 ALTER TABLE `representative_allocation` DISABLE KEYS */;
/*!40000 ALTER TABLE `representative_allocation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'user',
  `last_password_change` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'demo_user','$2b$10$WKUqkbsLN3oeo.XV5fEF3.lLxo5z6RN6c7WfDn3/Td29WTVYIzxvO','admin','2025-08-17 21:41:06');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-02 11:14:58
