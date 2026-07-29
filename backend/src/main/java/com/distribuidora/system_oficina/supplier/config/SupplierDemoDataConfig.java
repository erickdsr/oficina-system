package com.distribuidora.system_oficina.supplier.config;

import java.util.List;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;

import com.distribuidora.system_oficina.supplier.entity.Supplier;
import com.distribuidora.system_oficina.supplier.repository.SupplierRepository;

@Configuration
@Profile("!test")
public class SupplierDemoDataConfig {

    @Bean
    @Order(2)
    ApplicationRunner seedAutomotiveSuppliers(SupplierRepository supplierRepository) {
        return args -> {
            deactivateFakeSupplierRows(supplierRepository);
            demoSuppliers().forEach(supplier -> {
                Supplier entity = supplierRepository.findByCnpj(supplier.getCnpj()).orElse(supplier);
                applyCanonicalData(entity, supplier);
                supplierRepository.save(entity);
            });
        };
    }

    private List<Supplier> demoSuppliers() {
        return List.of(
                supplier("Bosch Brasil", "Robert Bosch Ltda.", "46000000000100", "244987321118", "Carlos Mendes", "compras@bosch-autopecas.com.br", "1140001000", "13010000", "Avenida Brasil", "1000", "Centro", "Campinas", "SP"),
                supplier("Cofap", "Cofap Autopecas Ltda.", "33987012000145", "286445987113", "Marina Alves", "atendimento@cofapdistribuicao.com.br", "1141223400", "09750000", "Avenida Kennedy", "2100", "Rudge Ramos", "Sao Bernardo do Campo", "SP"),
                supplier("Continental", "Continental Automotive Brasil Ltda.", "12500876000130", "903876221009", "Renato Silveira", "vendas@continentalpecas.com.br", "4133124400", "81200000", "Rua Joao Bettega", "5400", "Cidade Industrial", "Curitiba", "PR"),
                supplier("Delphi Technologies", "Delphi Sistemas Automotivos Ltda.", "59120645000118", "671220098117", "Juliana Rocha", "comercial@delphitechnologies.com.br", "1145902200", "09370000", "Avenida Papa Joao XXIII", "3980", "Sertaozinho", "Maua", "SP"),
                supplier("Fras-le", "Fras-le Componentes de Friccao S.A.", "88561001000140", "0298845127", "Rafael Nunes", "distribuicao@fras-leauto.com.br", "5432097800", "95010000", "Rua Visconde de Pelotas", "1900", "Centro", "Caxias do Sul", "RS"),
                supplier("Mahle Metal Leve", "Mahle Metal Leve S.A.", "60918768000112", "244110765119", "Patricia Campos", "pedidos@mahlemetalleve.com.br", "1143889000", "13280000", "Rodovia Anhanguera", "Km 49", "Distrito Industrial", "Vinhedo", "SP"),
                supplier("Lubrax Distribuidora", "Petrobras Distribuidora S.A.", "34274233000102", "117980432118", "Ricardo Lima", "pedidos@lubraxdistribuidora.com.br", "2135489000", "20031170", "Avenida Republica do Chile", "65", "Centro", "Rio de Janeiro", "RJ"),
                supplier("Marelli", "Marelli Cofap do Brasil Ltda.", "02513456000170", "117398452118", "Andre Luiz", "comercial@marelliautopecas.com.br", "1141993200", "09760000", "Rua Afonsina", "530", "Rudge Ramos", "Sao Bernardo do Campo", "SP"),
                supplier("Monroe", "Monroe Amortecedores Brasil Ltda.", "47664032000106", "904330187221", "Fernanda Lima", "fornecedores@monroeauto.com.br", "4734216000", "89219000", "Rua Dona Francisca", "8300", "Distrito Industrial", "Joinville", "SC"),
                supplier("NGK", "NGK do Brasil Ltda.", "61226344000156", "244993876112", "Eduardo Batista", "vendas@ngkpecas.com.br", "1145338100", "09690000", "Avenida Piraporinha", "1100", "Planalto", "Sao Bernardo do Campo", "SP"),
                supplier("SKF", "SKF do Brasil Ltda.", "61641606000110", "117450982116", "Beatriz Duarte", "relacionamento@skfauto.com.br", "1138779000", "05038000", "Avenida Embaixador Macedo Soares", "10735", "Vila Leopoldina", "Sao Paulo", "SP"),
                supplier("TRW", "TRW Automotive Brasil Ltda.", "04011888000190", "044887321115", "Sergio Azevedo", "pecas@trwdistribuicao.com.br", "8133315500", "50030000", "Rua do Apolo", "181", "Recife Antigo", "Recife", "PE"),
                supplier("Valeo Brasil", "Valeo Sistemas Automotivos Ltda.", "54321098000177", "117650324118", "Luciana Ferreira", "compras@valeoauto.com.br", "1142017700", "09380000", "Avenida Joao Ramalho", "1450", "Vila Noemia", "Maua", "SP")
        );
    }

    private Supplier supplier(
            String tradeName,
            String legalName,
            String cnpj,
            String stateRegistration,
            String contactName,
            String email,
            String phone,
            String zipCode,
            String street,
            String number,
            String district,
            String city,
            String state) {
        Supplier supplier = new Supplier();
        supplier.setName(tradeName);
        supplier.setTradeName(tradeName);
        supplier.setLegalName(legalName);
        supplier.setCnpj(cnpj);
        supplier.setStateRegistration(stateRegistration);
        supplier.setContactName(contactName);
        supplier.setEmail(email);
        supplier.setPhone(phone);
        supplier.setZipCode(zipCode);
        supplier.setStreet(street);
        supplier.setNumber(number);
        supplier.setDistrict(district);
        supplier.setCity(city);
        supplier.setState(state);
        supplier.setAddress("%s, %s - %s".formatted(street, number, district));
        supplier.setStatus(true);
        return supplier;
    }

    private void applyCanonicalData(Supplier target, Supplier source) {
        target.setName(source.getName());
        target.setTradeName(source.getTradeName());
        target.setLegalName(source.getLegalName());
        target.setCnpj(source.getCnpj());
        target.setStateRegistration(source.getStateRegistration());
        target.setContactName(source.getContactName());
        target.setEmail(source.getEmail());
        target.setPhone(source.getPhone());
        target.setZipCode(source.getZipCode());
        target.setStreet(source.getStreet());
        target.setNumber(source.getNumber());
        target.setDistrict(source.getDistrict());
        target.setComplement(source.getComplement());
        target.setCity(source.getCity());
        target.setState(source.getState());
        target.setAddress(source.getAddress());
        target.setStatus(true);
    }

    private void deactivateFakeSupplierRows(SupplierRepository supplierRepository) {
        supplierRepository.findAll().stream()
                .filter(this::hasFakeDemoMarker)
                .forEach(supplier -> {
                    supplier.setStatus(false);
                    supplierRepository.save(supplier);
                });
    }

    private boolean hasFakeDemoMarker(Supplier supplier) {
        String value = "%s %s %s %s".formatted(
                supplier.getName(),
                supplier.getTradeName(),
                supplier.getCity(),
                supplier.getEmail()).toLowerCase();
        return value.contains("teste")
                || value.contains("cidade123")
                || ("valeo".equalsIgnoreCase(supplier.getName()) && !"54321098000177".equals(supplier.getCnpj()));
    }
}
