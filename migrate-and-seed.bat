@echo off
echo === Running Database Migrations ===
docker exec -it afrihealth-auth npx prisma migrate deploy
docker exec -it afrihealth-patient npx prisma migrate deploy
docker exec -it afrihealth-provider npx prisma migrate deploy
docker exec -it afrihealth-records npx prisma migrate deploy
docker exec -it afrihealth-blockchain npx prisma migrate deploy

echo === Seeding Databases ===
docker exec -it afrihealth-auth npx prisma db seed
docker exec -it afrihealth-patient npx prisma db seed
docker exec -it afrihealth-provider npx prisma db seed
docker exec -it afrihealth-records npx prisma db seed
docker exec -it afrihealth-blockchain npx prisma db seed

echo === Database Migration ^& Seeding Completed successfully ===
pause
