<?php
$user = get_user_by('login', 'admin');
if (!$user) {
    $user = get_users(['role' => 'administrator'])[0];
}
$user_id = $user->ID;
$description = 'DAMA-CRM Integration';
$permissions = 'read_write';
$consumer_key = 'ck_' . wc_rand_hash();
$consumer_secret = 'cs_' . wc_rand_hash();

global $wpdb;
$wpdb->insert(
    $wpdb->prefix . 'woocommerce_api_keys',
    array(
        'user_id' => $user_id,
        'description' => $description,
        'permissions' => $permissions,
        'consumer_key' => wc_api_hash($consumer_key),
        'consumer_secret' => $consumer_secret,
        'truncated_key' => substr($consumer_key, -7)
    )
);

echo json_encode(array('key' => $consumer_key, 'secret' => $consumer_secret));
