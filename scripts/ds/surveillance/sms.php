<?php

$url = "https://hooks.slack.com/services/TLBF3173N/${_GET['username']}/${_GET['password']}";
$context = stream_context_create([
    'http' => [
        'method'  => 'POST',
        'header'  => 'Content-Type: application/json',
        'content' => json_encode([
            'text' => $_GET['message'],
        ]),
    ]
]);
file_get_contents($url, false, $context);
