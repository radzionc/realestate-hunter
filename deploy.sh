yarn build
cd dist && zip -r lambda.zip index.js*

BUCKET_KEY=lambda.zip

aws s3 cp $BUCKET_KEY s3://$BUCKET/$BUCKET_KEY
aws lambda update-function-code --function-name $FUNCTION_NAME --s3-bucket $BUCKET --s3-key $BUCKET_KEY

cd ..
rm -rf dist