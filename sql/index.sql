ayudame en crear los inser para las "semanas" pasadas a la actual de enero a la fecha las semanas son de viernes a jueves, respeta el formato de todo

CREATE TABLE `eut_weeklyrange` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dateBegin` datetime NOT NULL,
  `dateEnd` datetime NOT NULL,
  `numMonth` varchar(2) DEFAULT NULL,
  `month` varchar(12) DEFAULT NULL,
  `range` varchar(17) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=425 DEFAULT CHARSET=utf8mb3;

'424', '2025-09-05 00:00:00', '2025-09-11 23:59:59', '09', 'SEPTIEMBRE', '05 SEP - 11 SEP'
