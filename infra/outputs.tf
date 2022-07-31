output "lambda_code_bucket" {
  value = aws_s3_bucket.lambda_storage.bucket
}

output "lambda_function_name" {
  value = aws_lambda_function.service.function_name
}
