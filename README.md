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

3. Install the required dependencies: 
    ```
    npm install
    ```

4. Create a `.env` file in the root directory and fill in the necessary variables. An example file, `.env.example`, is provided as a reference.

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

- `RPC_URL`: The URL of the Stacks Blockchain API instance.

- `SIGNER_PUBLIC_KEY`: The public key of the account signing transactions.

- `SIGNER_PRIVATE_KEY`: The private key of the account signing transactions.

- `SOURCE_ORACLE_CONTRACT`: The address and name of the source oracle contract.

- `UWU_ORACLE_CONTRACT`: The address and name of UWU Protocol's oracle contract.

- `TX_MIN_FEE_RATE`: The minimum fee rate in uSTX paid to broadcast transactions.

- `TX_MAX_FEE_RATE`: The maximum fee rate in uSTX paid to broadcast transactions.

- `TX_RBF_INCREMENT`: The amount of uSTX added to the fee rate of a transaction that is being replaced.

## Discussion
Please join us on [Discord](http://chat.uwu.cash) for discussions or report any issues you encounter on this Github repository or on our [Canny](https://uwu.canny.io).

## Code of Conduct
Please read our [Code of Conduct](CODE_OF_CONDUCT.md) to understand our community standards and expectations.

## License

This repository is licenesed under the GNU General Public License v3.0. See [LICENSE](LICENSE) for more information.
