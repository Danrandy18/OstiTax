class BankInstitution {
  const BankInstitution({required this.id, required this.name, this.bic});

  final String id;
  final String name;
  final String? bic;

  factory BankInstitution.fromJson(Map<String, dynamic> json) =>
      BankInstitution(
        id: json['id'] as String,
        name: json['name'] as String,
        bic: json['bic'] as String?,
      );
}

class BankConnection {
  const BankConnection({
    required this.id,
    required this.institutionId,
    required this.institutionName,
    required this.status,
    required this.errorMessage,
    required this.createdAt,
  });

  final String id;
  final String institutionId;
  final String? institutionName;
  final String status;
  final String? errorMessage;
  final String createdAt;

  factory BankConnection.fromJson(Map<String, dynamic> json) =>
      BankConnection(
        id: json['id'] as String,
        institutionId: json['institutionId'] as String,
        institutionName: json['institutionName'] as String?,
        status: json['status'] as String,
        errorMessage: json['errorMessage'] as String?,
        createdAt: json['createdAt'] as String,
      );
}

class BankTransaction {
  const BankTransaction({
    required this.id,
    required this.bookingDate,
    required this.amount,
    required this.currency,
    required this.remittanceInfo,
    required this.counterpartyName,
  });

  final String id;
  final String? bookingDate;
  final String amount;
  final String currency;
  final String? remittanceInfo;
  final String? counterpartyName;

  factory BankTransaction.fromJson(Map<String, dynamic> json) =>
      BankTransaction(
        id: json['id'] as String,
        bookingDate: json['bookingDate'] as String?,
        amount: json['amount'] as String,
        currency: json['currency'] as String,
        remittanceInfo: json['remittanceInfo'] as String?,
        counterpartyName: json['counterpartyName'] as String?,
      );
}
