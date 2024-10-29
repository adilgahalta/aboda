import { returnAdminDetail, returnBranch } from '@/helpers/branch';
import { ErrorHandler } from '@/helpers/response';
import { IBranch } from '@/interfaces/branch';
import prisma from '@/prisma';
import { Request } from 'express';

export class BranchService {
  static async getAllBranch(req: Request) {
    if (req.user.roleId != 2)
      throw new ErrorHandler('Unauthorized, Super Admin only!.', 400);

    return returnBranch();
  }

  static async getAllUnassignedAdmin(req: Request) {
    if (req.user.roleId != 2)
      throw new ErrorHandler('Unauthorized, Super admin only!', 400);
    return await returnAdminDetail();
  }

  static async createStoreAdmin(req: Request) {
    return prisma.$transaction(async (prisma) => {
      if (req.user.roleId != 2)
        throw new ErrorHandler('Unauthorized, Super admin only!', 400);

      const { first_name, last_name, phone_number, email } = req.body;
      const newUser = prisma.user.create({
        data: {
          first_name,
          last_name,
          phone_number,
          email,
          Role: {
            connect: {
              id: 3,
            },
          },
          is_verified: 1,
          password: 'admin123',
        },
      });

      await prisma.adminDetail.create({
        data: {
          userId: (await newUser).id,
        },
      });

      return await returnAdminDetail();
    });
  }

  static async updateBranch(req: Request) {
    return prisma.$transaction(async (prisma) => {
      if (req.user.roleId != 2)
        throw new ErrorHandler('Unauthorized, Super admin only!', 400);
      const branchData: IBranch = req.body.data;
      await prisma.branch.update({
        where: {
          id: branchData.id,
        },
        data: {
          branch_name: branchData.branch_name,
          address: {
            update: {
              where: {
                id: branchData.addressId,
              },
              data: {
                cityId: branchData.address.cityId,
                street: branchData.address.street,
                lon: branchData.address.lon,
                lat: branchData.address.lat,
              },
            },
          },
        },
      });
      for (let i = 0; i < branchData.AdminDetails.length; i++) {
        branchData.AdminDetails[i].branchId == null &&
          (await prisma.adminDetail.update({
            where: {
              id: branchData.AdminDetails[i].id,
            },
            data: {
              branchId: branchData.id,
            },
          }));
      }
      return await returnBranch();
    });
  }

  static async addBranch(req: Request) {
    return prisma.$transaction(async (prisma) => {
      if (req.user.roleId != 2)
        throw new ErrorHandler('Unauthorized, Super admin only!', 400);
      const branchData: IBranch = req.body.data;

      const newAddress = await prisma.address.create({
        data: {
          cityId: branchData.address.City.id,
          street: branchData.address.street,
          lon: branchData.address.lon,
          lat: branchData.address.lat,
        },
      });
      const newBranch = await prisma.branch.create({
        data: {
          branch_name: branchData.branch_name,
          addressId: newAddress.id,
        },
      });
      if (branchData.AdminDetails.length > 0) {
        for (let i = 0; i < branchData.AdminDetails.length; i++) {
          branchData.AdminDetails[i].branchId == null &&
            (await prisma.adminDetail.update({
              where: {
                id: branchData.AdminDetails[i].id,
              },
              data: {
                branchId: branchData.id,
              },
            }));
        }
      }

      const allProducts = await prisma.product.findMany();
      await prisma.productStock.createMany({
        data: allProducts.map((product) => ({
          branchId: newBranch.id,
          productId: product.id,
          stock: 0,
        })),
      });
      const hasil = await returnBranch();
      console.log(hasil, 'ini hasil');
      return hasil;
    });
  }

  static async deleteBranch(req: Request) {
    return prisma.$transaction(async (prisma) => {
      if (req.user.roleId != 2)
        throw new ErrorHandler('Unauthorized, Super admin only!', 400);

      const { id } = req.params;

      await prisma.branch.delete({
        where: {
          id: Number(id),
        },
      });
    });
  }
}
