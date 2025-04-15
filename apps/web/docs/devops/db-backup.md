name: Database Backup

on:
  schedule:
    - cron: "0 2 * * *" # Run daily at 2 AM UTC
  workflow_dispatch: # Allow manual triggering

jobs:
  backup-supabase:
    name: Backup Supabase Database
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Authenticate Supabase CLI
        run: supabase login ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Backup Database
        run: |
          TIMESTAMP=$(date +%Y%m%d-%H%M%S)
          BACKUP_FILE="backup-$TIMESTAMP.sql"

          # Create backup using Supabase CLI
          supabase db dump --db-url ${{ secrets.SUPABASE_DATABASE_URL }} -f $BACKUP_FILE

          # Compress the backup
          gzip $BACKUP_FILE

      - name: Upload backup to S3
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      # - name: Copy backup to S3
      #   run: |
      #     TIMESTAMP=$(date +%Y%m%d-%H%M%S)
      #     BACKUP_FILE="backup-$TIMESTAMP.sql.gz"

      #     # Upload to S3
      #     aws s3 cp $BACKUP_FILE s3://${{ secrets.BACKUP_BUCKET }}/database-backups/$BACKUP_FILE

      #     # Keep only the last 30 backups
      #     aws s3 ls s3://${{ secrets.BACKUP_BUCKET }}/database-backups/ --recursive | sort | head -n -30 | awk '{print $4}' | xargs -I {} aws s3 rm s3://${{ secrets.BACKUP_BUCKET }}/{}
