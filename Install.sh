echo '====== Matcha ======'
echo 'Cleaning up old builds'
rm -rf ./Matcha/RandomUserGenerator/exe
docker compose down
./fclean_db.sh

echo 'Building RandomUserGenerator'
dotnet publish RandomUserGenerator --runtime linux-x64 --self-contained true --configuration Release -o ./RandomUserGenerator/exe
echo '====== Done ======'

echo '====== Web application ======'
echo 'Building Web application'

docker compose up -d

echo '====== Done ======'