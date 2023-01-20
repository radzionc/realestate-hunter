terraform {
  backend "s3" {
    bucket  = "infrastructure-remote-state"
    key     = "realestate/hunter.tfstate"
    region  = "eu-central-1"
    encrypt = true
  }
}

resource "aws_s3_bucket" "lambda_storage" {
  bucket = "${var.name}-storage"
}

data "archive_file" "local_zipped_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda.zip"
}

resource "aws_s3_object" "zipped_lambda" {
  bucket = aws_s3_bucket.lambda_storage.bucket
  key    = "lambda.zip"
  source = data.archive_file.local_zipped_lambda.output_path
}

resource "aws_dynamodb_table" "state" {
  name         = "${var.name}-state"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

resource "aws_iam_role" "service" {
  name = var.name

  assume_role_policy = jsonencode(
    {
      Version = "2012-10-17",
      Statement = [
        {
          Action = "sts:AssumeRole",
          Principal = {
            Service = "lambda.amazonaws.com"
          },
          Effect = "Allow",
          Sid    = ""
        }
      ]
    }
  )
}

resource "aws_iam_role_policy_attachment" "service" {
  role       = aws_iam_role.service.name
  policy_arn = aws_iam_policy.service.arn
}

resource "aws_lambda_function" "service" {
  function_name = var.name

  s3_bucket   = aws_s3_bucket.lambda_storage.bucket
  s3_key      = "lambda.zip"
  memory_size = "1024"

  handler = "index.handler"
  runtime = "nodejs16.x"
  timeout = "50"
  role    = aws_iam_role.service.arn

  environment {
    variables = {
      SENTRY_KEY           = var.sentry_key
      TELEGRAM_BOT_TOKEN   = var.telegram_bot_token
      TELEGRAM_BOT_CHAT_ID = var.telegram_bot_chat_id
      STATE_TABLE_NAME     = aws_dynamodb_table.state.name
    }
  }
}

resource "aws_iam_policy" "service" {
  name = var.name
  path = "/"

  policy = jsonencode(
    {
      Version = "2012-10-17",
      Statement = [
        {
          Action = [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          Resource = "arn:aws:logs:*:*:*",
          Effect   = "Allow"
        },
        {
          Action   = "dynamodb:*",
          Resource = "${aws_dynamodb_table.state.arn}",
          Effect   = "Allow"
        }
      ]
  })
}

resource "aws_cloudwatch_event_rule" "lambda" {
  name                = var.name
  schedule_expression = "rate(30 minutes)"
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.lambda.name
  target_id = var.name
  arn       = aws_lambda_function.service.arn
}

resource "aws_lambda_permission" "lambda_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.service.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.lambda.arn
}

