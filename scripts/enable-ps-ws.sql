USE prestashop;

UPDATE ps_configuration SET value = 1 WHERE name = 'PS_WEBSERVICE';

INSERT INTO ps_webservice_account (`key`, `description`, `class_name`, `is_module`, `module_name`, `active`) 
VALUES ('DAMACRMTESTKEY123456789012345678', 'DAMA-CRM', 'WebserviceKey', 0, '', 1)
ON DUPLICATE KEY UPDATE `active` = 1;

SET @account_id = (SELECT id_webservice_account FROM ps_webservice_account WHERE `key` = 'DAMACRMTESTKEY123456789012345678' LIMIT 1);

INSERT IGNORE INTO ps_webservice_permission (id_webservice_account, resource, method) VALUES
(@account_id, 'customers', 'GET'),
(@account_id, 'customers', 'PUT'),
(@account_id, 'customers', 'POST'),
(@account_id, 'orders', 'GET'),
(@account_id, 'orders', 'PUT'),
(@account_id, 'orders', 'POST'),
(@account_id, 'products', 'GET'),
(@account_id, 'products', 'PUT'),
(@account_id, 'products', 'POST'),
(@account_id, 'addresses', 'GET'),
(@account_id, 'addresses', 'PUT'),
(@account_id, 'addresses', 'POST');
