using Npgsql;
using System.Data;
using System.Threading.Tasks;

public class DatabaseService
{
    private readonly string _connectionString;

    public DatabaseService(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<DataTable> ExecuteQueryAsync(string query, params NpgsqlParameter[] parameters)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await using var cmd = new NpgsqlCommand(query, conn);
        cmd.Parameters.AddRange(parameters);

        var dataTable = new DataTable();
        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        dataTable.Load(reader);
        return dataTable;
    }

    public async Task<int> ExecuteNonQueryAsync(string query, params NpgsqlParameter[] parameters)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await using var cmd = new NpgsqlCommand(query, conn);
        cmd.Parameters.AddRange(parameters);

        await conn.OpenAsync();
        return await cmd.ExecuteNonQueryAsync();
    }
}
