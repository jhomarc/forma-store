<?php
// process_order.php
// LEARNING EXAMPLE ONLY.
// This shows how PHP could receive and validate an order on a PHP server
// (for example, XAMPP or a school web host). The FORMA STORE website does NOT
// depend on this file. Vercel does not run PHP by default, so the live
// checkout works with JavaScript and localStorage instead.

header("Content-Type: application/json");

// Only accept POST requests (sent from a form).
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Only POST requests are allowed."]);
    exit;
}

// Read and clean the form fields.
$name    = trim($_POST["name"] ?? "");
$email   = trim($_POST["email"] ?? "");
$phone   = trim($_POST["phone"] ?? "");
$address = trim($_POST["address"] ?? "");
$payment = trim($_POST["payment"] ?? "");

// Collect validation errors.
$errors = [];
if ($name === "")                                  $errors[] = "Name is required.";
if (!filter_var($email, FILTER_VALIDATE_EMAIL))    $errors[] = "A valid email is required.";
if (!preg_match('/^[0-9+\-\s()]{7,}$/', $phone))   $errors[] = "A valid phone number is required.";
if ($address === "")                               $errors[] = "Delivery address is required.";
if (!in_array($payment, ["Cash on Delivery", "GCash"], true)) {
    $errors[] = "Please choose a valid payment method.";
}

// If anything is wrong, send the errors back.
if (count($errors) > 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "errors" => $errors]);
    exit;
}

// Create a simple demo order number.
$orderNumber = "FS-" . date("Ymd") . "-" . rand(1000, 9999);

// A real store would save the order to a database here.
// This demo only returns the order number.
echo json_encode([
    "success"     => true,
    "orderNumber" => $orderNumber,
    "message"     => "Demo order received. No real payment was made."
]);
