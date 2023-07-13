# Oracle Keeper
A microservice that pushes price data to the Oracle Proxy.

## Setup
1. Clone the repository: 
    ```
    git clone https://github.com/uwuprotocol/oracle-keeper.git
    ```

2. Navigate into the directory: 
    ```
    cd oracle-keeper
    ```

3. Install the dependencies: 
    ```
    npm install
    ```

4. Create a `.env` file in the root directory and fill in the necessary variables. An example file `.env.example` is provided.

## Usage
1. Navigate into the directory: 
    ```
    cd oracle-keeper
    ```
    
2. Run the Oracle Keeper:
    ```
    npm start
    ```

## Environment Variables

The following environment variables are needed in the `.env` file:

- `BLOCKCHAIN_API`: The URL of the Stacks Blockchain API instance you're interacting with. 

- `PUBLIC_KEY`: The public key for the address used to broadcast transactions.

- `PRIVATE_KEY`: The private key for the address used to broadcast transactions. 

- `CONTRACT_ADDRESS`: The address of the contract you want to interact with.

- `CONTRACT_NAME`: The name of the contract you want to interact with.

- `FUNCTION_NAME`: The name of the function in the contract that you want to call.

- `FEE_RATE`: The fee rate in microstacks for broadcasting transactions.

## License

This repository is licenesed under the GNU General Public License v3.0. See [LICENSE](LICENSE) for more information.
