enum EmploymentType {
  employee('employee'),
  apprentice('apprentice'),
  pensioner('pensioner');

  const EmploymentType(this.wire);
  final String wire;
}

enum IncomePeriod {
  monthly('monthly'),
  yearly('yearly');

  const IncomePeriod(this.wire);
  final String wire;
}

enum AustrianState {
  wien('wien'),
  niederoesterreich('niederoesterreich'),
  oberoesterreich('oberoesterreich'),
  burgenland('burgenland'),
  salzburg('salzburg'),
  steiermark('steiermark'),
  kaernten('kaernten'),
  tirol('tirol'),
  vorarlberg('vorarlberg');

  const AustrianState(this.wire);
  final String wire;
}

enum FamilyBonusType {
  none('none'),
  full('full'),
  shared('shared');

  const FamilyBonusType(this.wire);
  final String wire;
}

enum CommuteDaysPerMonth {
  lessThan4('less_than_4'),
  from4to7('from_4_to_7'),
  from8to10('from_8_to_10'),
  moreThan10('more_than_10');

  const CommuteDaysPerMonth(this.wire);
  final String wire;
}

class CompanyCarInput {
  const CompanyCarInput({
    required this.acquisitionCost,
    required this.co2GramsPerKm,
    required this.firstRegistrationYear,
    this.halfBenefit = false,
  });

  final double acquisitionCost;
  final int co2GramsPerKm;
  final int firstRegistrationYear;
  final bool halfBenefit;

  Map<String, dynamic> toJson() => {
    'acquisitionCost': acquisitionCost,
    'co2GramsPerKm': co2GramsPerKm,
    'firstRegistrationYear': firstRegistrationYear,
    'halfBenefit': halfBenefit,
  };
}

class CalculateRequest {
  const CalculateRequest({
    this.employmentType = EmploymentType.employee,
    this.grossAmount = 3000,
    this.incomePeriod = IncomePeriod.monthly,
    this.state = AustrianState.wien,
    this.soleEarnerDeduction = false,
    this.familyBonus = FamilyBonusType.none,
    this.childrenUnder18 = 0,
    this.childrenOver18WithFamilyAllowance = 0,
    this.benefitInKindMonthly = 0,
    this.benefitInKindFromCompanyCar = false,
    this.companyCar,
    this.taxFreeAllowanceMonthly = 0,
    this.commuteOneWayKm = 0,
    this.publicTransportReasonable = true,
    this.commuteDaysPerMonth = CommuteDaysPerMonth.moreThan10,
  });

  final EmploymentType employmentType;
  final double grossAmount;
  final IncomePeriod incomePeriod;
  final AustrianState state;
  final bool soleEarnerDeduction;
  final FamilyBonusType familyBonus;
  final int childrenUnder18;
  final int childrenOver18WithFamilyAllowance;
  final double benefitInKindMonthly;
  final bool benefitInKindFromCompanyCar;
  final CompanyCarInput? companyCar;
  final double taxFreeAllowanceMonthly;
  final double commuteOneWayKm;
  final bool publicTransportReasonable;
  final CommuteDaysPerMonth commuteDaysPerMonth;

  CalculateRequest copyWith({
    EmploymentType? employmentType,
    double? grossAmount,
    IncomePeriod? incomePeriod,
    AustrianState? state,
    bool? soleEarnerDeduction,
    FamilyBonusType? familyBonus,
    int? childrenUnder18,
    int? childrenOver18WithFamilyAllowance,
    double? benefitInKindMonthly,
    bool? benefitInKindFromCompanyCar,
    Object? companyCar = _unset,
    double? taxFreeAllowanceMonthly,
    double? commuteOneWayKm,
    bool? publicTransportReasonable,
    CommuteDaysPerMonth? commuteDaysPerMonth,
  }) {
    return CalculateRequest(
      employmentType: employmentType ?? this.employmentType,
      grossAmount: grossAmount ?? this.grossAmount,
      incomePeriod: incomePeriod ?? this.incomePeriod,
      state: state ?? this.state,
      soleEarnerDeduction: soleEarnerDeduction ?? this.soleEarnerDeduction,
      familyBonus: familyBonus ?? this.familyBonus,
      childrenUnder18: childrenUnder18 ?? this.childrenUnder18,
      childrenOver18WithFamilyAllowance:
          childrenOver18WithFamilyAllowance ??
          this.childrenOver18WithFamilyAllowance,
      benefitInKindMonthly: benefitInKindMonthly ?? this.benefitInKindMonthly,
      benefitInKindFromCompanyCar:
          benefitInKindFromCompanyCar ?? this.benefitInKindFromCompanyCar,
      companyCar: identical(companyCar, _unset)
          ? this.companyCar
          : companyCar as CompanyCarInput?,
      taxFreeAllowanceMonthly:
          taxFreeAllowanceMonthly ?? this.taxFreeAllowanceMonthly,
      commuteOneWayKm: commuteOneWayKm ?? this.commuteOneWayKm,
      publicTransportReasonable:
          publicTransportReasonable ?? this.publicTransportReasonable,
      commuteDaysPerMonth: commuteDaysPerMonth ?? this.commuteDaysPerMonth,
    );
  }

  Map<String, dynamic> toJson() => {
    'employmentType': employmentType.wire,
    'grossAmount': grossAmount,
    'incomePeriod': incomePeriod.wire,
    'state': state.wire,
    'soleEarnerDeduction': soleEarnerDeduction,
    'familyBonus': familyBonus.wire,
    'childrenUnder18': childrenUnder18,
    'childrenOver18WithFamilyAllowance': childrenOver18WithFamilyAllowance,
    'benefitInKindMonthly': benefitInKindMonthly,
    'benefitInKindFromCompanyCar': benefitInKindFromCompanyCar,
    if (benefitInKindFromCompanyCar && companyCar != null)
      'companyCar': companyCar!.toJson(),
    'taxFreeAllowanceMonthly': taxFreeAllowanceMonthly,
    'commuteOneWayKm': commuteOneWayKm,
    'publicTransportReasonable': publicTransportReasonable,
    'commuteDaysPerMonth': commuteDaysPerMonth.wire,
  };
}

const _unset = Object();

class PaymentBreakdown {
  const PaymentBreakdown({
    required this.gross,
    required this.socialInsurance,
    required this.incomeTax,
    required this.net,
  });

  final double gross;
  final double socialInsurance;
  final double incomeTax;
  final double net;

  factory PaymentBreakdown.fromJson(Map<String, dynamic> json) =>
      PaymentBreakdown(
        gross: (json['gross'] as num).toDouble(),
        socialInsurance: (json['socialInsurance'] as num).toDouble(),
        incomeTax: (json['incomeTax'] as num).toDouble(),
        net: (json['net'] as num).toDouble(),
      );
}

class UsageInfo {
  const UsageInfo({
    required this.plan,
    required this.isPro,
    required this.freeAttemptsRemaining,
  });

  final String plan;
  final bool isPro;
  final int freeAttemptsRemaining;

  factory UsageInfo.fromJson(Map<String, dynamic> json) => UsageInfo(
    plan: json['plan'] as String,
    isPro: json['isPro'] as bool,
    freeAttemptsRemaining: (json['freeAttemptsRemaining'] as num).toInt(),
  );
}

class CalculateResponse {
  const CalculateResponse({
    required this.tableYear,
    required this.recurring,
    required this.thirteenth,
    required this.fourteenth,
    required this.annual,
    this.usage,
  });

  final int tableYear;
  final PaymentBreakdown recurring;
  final PaymentBreakdown thirteenth;
  final PaymentBreakdown fourteenth;
  final PaymentBreakdown annual;
  final UsageInfo? usage;

  factory CalculateResponse.fromJson(Map<String, dynamic> json) =>
      CalculateResponse(
        tableYear: (json['tableYear'] as num).toInt(),
        recurring: PaymentBreakdown.fromJson(
          json['recurring'] as Map<String, dynamic>,
        ),
        thirteenth: PaymentBreakdown.fromJson(
          json['thirteenth'] as Map<String, dynamic>,
        ),
        fourteenth: PaymentBreakdown.fromJson(
          json['fourteenth'] as Map<String, dynamic>,
        ),
        annual: PaymentBreakdown.fromJson(
          json['annual'] as Map<String, dynamic>,
        ),
        usage: json['usage'] != null
            ? UsageInfo.fromJson(json['usage'] as Map<String, dynamic>)
            : null,
      );
}
